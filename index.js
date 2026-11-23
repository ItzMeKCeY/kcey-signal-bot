/**
 * @project  KCeY Signal Bot - Sri Lanka's First Multi-Device Signal Bot
 * @author   KCeY (ItzMeKCeY / DevRabbitZz)
 * @team     Dark Tech Zone (DTZ)
 * @api      https://api.kcey.online
 */

const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');
const http = require('http');

const SignalClient = require('./lib/signalEngine');
const config = require('./config');
const events = require('./command');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('KCeY Signal Bot (Dark Tech Zone) is running!');
});
const PORT = process.env.PORT || 8080;
server.listen(PORT);

require('events').EventEmitter.defaultMaxListeners = 500;

global.signalMsgCache = global.signalMsgCache || new Map();
function cacheSignalAttachments(timestamp, attachments) {
    if (!timestamp || !Array.isArray(attachments) || attachments.length === 0) return;
    global.signalMsgCache.set(String(timestamp), attachments);
    if (global.signalMsgCache.size > 500) {
        global.signalMsgCache.delete(global.signalMsgCache.keys().next().value);
    }
}

try {
    const pluginPath = path.join(__dirname, 'plugins');
    if (fs.existsSync(pluginPath)) {
        fs.readdirSync(pluginPath).forEach((plugin) => {
            if (path.extname(plugin).toLowerCase() === '.js') {
                try {
                    require(path.join(pluginPath, plugin));
                } catch (e) {
                    console.error(`[PLUGIN ERROR] ${plugin}:`, e.message);
                }
            }
        });
    }
} catch (e) {}

const commandMap = new Map();
for (const cmd of events.commands) {
    if (cmd.pattern) commandMap.set(cmd.pattern.toLowerCase(), cmd);
    if (cmd.alias) {
        for (const alias of cmd.alias) {
            if (!commandMap.has(alias.toLowerCase())) {
                commandMap.set(alias.toLowerCase(), cmd);
            }
        }
    }
}

const isTrue = (val) => val === true || val === 'true';

function resolveAttachmentPaths(attList) {
    if (!Array.isArray(attList)) return [];
    const attDir = path.join(__dirname, 'signal-data', 'attachments');
    return attList.map(att => {
        if (att.localPath && fs.existsSync(att.localPath)) return att;
        let foundPath = null;
        if (att.id) {
            const direct = path.join(attDir, att.id);
            if (fs.existsSync(direct)) {
                foundPath = direct;
            } else if (fs.existsSync(attDir)) {
                const files = fs.readdirSync(attDir);
                const match = files.find(f => f.startsWith(att.id) || f.includes(att.id));
                if (match) foundPath = path.join(attDir, match);
            }
        }
        return { ...att, localPath: foundPath };
    });
}

async function launchBot(botNumber) {
    const sock = new SignalClient();

    sock.on('open', async (connectedNum) => {
        console.log(`[CONNECTED] KCeY Signal Bot (Dark Tech Zone) Active as ${connectedNum}`);
        if (!config.OWNER.includes(connectedNum)) config.OWNER.push(connectedNum);

        try {
            await sock.sendMessage(connectedNum, {
                text: `🎀 *KCeY Signal Bot Connected!* 🤍\n\n- 🥕 \`Prefix\` ➜ [ *${config.PREFIX}* ]\n- 💗 \`Team\` ➜ *Dark Tech Zone (DTZ)*\n- 🥹 \`Commands\` ➜ *${events.commands.length}*${config.FOOTER}`
            });
        } catch (e) {}
    });

    sock.on('message', async (envelope) => {
        try {
            let dataMsg = envelope.dataMessage;
            let sender = envelope.sourceNumber || envelope.source;
            let pushname = envelope.sourceName || 'User';

            if (!dataMsg && envelope.syncMessage?.sentMessage) {
                dataMsg = envelope.syncMessage.sentMessage;
                sender = sock.botNumber;
                pushname = config.DEV_NAME || 'KCeY';
            }

            if (!dataMsg) return;

            const body = (dataMsg.message || '').trim();
            const timestamp = dataMsg.timestamp || envelope.timestamp;
            const groupInfo = dataMsg.groupInfo;
            const isGroup = Boolean(groupInfo && groupInfo.groupId);
            const from = isGroup ? groupInfo.groupId : (dataMsg.destinationNumber || sender);

            if (!from || !sender) return;

            const directAttachments = resolveAttachmentPaths(dataMsg.attachments || []);
            if (directAttachments.length > 0) {
                cacheSignalAttachments(timestamp, directAttachments);
            }

            const quoteObj = dataMsg.quote || null;
            let quotedAttachments = [];
            if (quoteObj) {
                if (Array.isArray(quoteObj.attachments) && quoteObj.attachments.length > 0) {
                    quotedAttachments = resolveAttachmentPaths(quoteObj.attachments);
                }
                const hasValidLocal = quotedAttachments.some(a => a.localPath && fs.existsSync(a.localPath));
                if (!hasValidLocal && quoteObj.id) {
                    const cached = global.signalMsgCache.get(String(quoteObj.id));
                    if (cached) {
                        quotedAttachments = resolveAttachmentPaths(cached);
                    }
                }
            }

            const isMe = sender === sock.botNumber;
            const isOwner = isMe || config.OWNER.includes(sender);

            if (isTrue(config.AUTO_READ) && !isMe && !isGroup) {
                sock.sendReceipt(sender, timestamp, 'read').catch(() => {});
            }

            if (isTrue(config.AUTO_REACT) && !isMe && body) {
                const emojis = config.REACT_EMOJIS || ['🎀', '💗', '🥹', '🥕', '🤍', '🫶'];
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                sock.sendReaction(from, randomEmoji, sender, timestamp).catch(() => {});
            }

            const mek = {
                key: { remoteJid: from, fromMe: isMe, id: String(timestamp), participant: sender },
                timestamp,
                sender,
                pushName: pushname,
                body,
                attachments: directAttachments,
                quote: quoteObj,
                quotedAttachments
            };

            const prefix = config.PREFIX || '.';
            const isCmd = body.startsWith(prefix);
            const command = isCmd ? body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase() : '';
            const args = body.trim().split(/ +/).slice(1);
            const q = args.join(' ');

            const reply = async (teks, options = {}) => {
                return await sock.sendMessage(from, { text: teks }, { quoted: mek, ...options });
            };

            const react = async (emoji) => {
                return await sock.sendReaction(from, emoji, sender, timestamp).catch(() => {});
            };

            const workMode = config.WORK_MODE ? config.WORK_MODE.toLowerCase() : 'public';
            if (!isOwner) {
                if (workMode === 'private') return;
                if (workMode === 'inbox' && isGroup) return;
                if (workMode === 'group' && !isGroup) return;
            }

            if (isCmd) {
                if (isTrue(config.AUTO_TYPING)) {
                    sock.sendTyping(from, false).catch(() => {});
                }

                const cmdObj = commandMap.get(command);
                if (cmdObj) {
                    try {
                        await cmdObj.function(sock, mek, mek, {
                            from,
                            quoted: mek,
                            body,
                            isCmd,
                            command,
                            args,
                            q,
                            isGroup,
                            sender,
                            senderNumber: sender,
                            botNumber: sock.botNumber,
                            pushname,
                            isMe,
                            isOwner,
                            prefix,
                            reply,
                            react
                        });
                    } catch (err) {
                        console.error(`[CMD ERROR] ${command}:`, err);
                        await reply(`❌ *Error:* ${err.message}`);
                    } finally {
                        if (isTrue(config.AUTO_TYPING)) {
                            sock.sendTyping(from, true).catch(() => {});
                        }
                    }
                }
            }
        } catch (err) {
            console.error('[MESSAGE HANDLER ERROR]:', err.message);
        }
    });

    await sock.start(botNumber);
}

async function start() {
    await fs.ensureDir(path.join(__dirname, 'tmp'));

    const envNum = process.env.BOT_NUMBER || config.BOT_NUMBER;
    if (envNum && envNum.trim().length >= 10) {
        await launchBot(envNum.trim());
    } else {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const ask = () => {
            rl.question('Enter your Signal Bot Number with country code (e.g. +947XXXXXXXX): ', async (input) => {
                const cleaned = input.trim().replace(/[^0-9+]/g, '');
                if (!cleaned || cleaned.length < 10) {
                    console.log('Invalid number! Include country code (e.g. +947XXXXXXXX)');
                    return ask();
                }
                rl.close();
                await launchBot(cleaned);
            });
        };
        ask();
    }
}

process.on('uncaughtException', (err) => console.error('[Uncaught]:', err.message));
process.on('unhandledRejection', (err) => console.error('[Unhandled]:', err?.message || err));

start();
