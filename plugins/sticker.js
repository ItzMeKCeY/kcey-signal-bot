/**
 * @plugin   Native Signal Sticker Maker (.s)
 * @author   KCeY | Dark Tech Zone (DTZ)
 */

const fs = require('fs-extra');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { cmd } = require('../command');
const config = require('../config');

const execFileAsync = promisify(execFile);

let FFMPEG_PATH = 'ffmpeg';
try {
    const staticBin = require('ffmpeg-static');
    if (staticBin && fs.existsSync(staticBin)) FFMPEG_PATH = staticBin;
} catch {}

cmd({
    pattern: 's',
    alias: ['sticker', 'stik', 'webp'],
    desc: 'Convert replied image to a native Signal Sticker',
    category: 'converter',
    react: '🎀',
    filename: __filename
},
async (conn, mek, m, { from, prefix, reply, react }) => {
    const tmpDir = path.join(__dirname, '../tmp');
    await fs.ensureDir(tmpDir);
    const stamp = Date.now();
    const packDir = path.join(tmpDir, `stkpack_${stamp}`);
    const outWebp = path.join(packDir, '0.webp');
    const manifestPath = path.join(packDir, 'manifest.json');
    const livePrefix = prefix || config.PREFIX || '.';

    try {
        const allAtts = [...(mek.quotedAttachments || []), ...(mek.attachments || [])];
        const mediaAtt = allAtts.find(a =>
            a.localPath &&
            fs.existsSync(a.localPath) &&
            (!a.contentType || a.contentType.startsWith('image/'))
        );

        if (!mediaAtt) {
            let errText = `🎀 *KCeY • Sticker Maker* 🤍\n\n`;
            errText += `⛔ *Please reply to an Image!*\n\n`;
            errText += `- 🥕 \`Usage\` ➜ Reply to any photo with \`${livePrefix}s\`\n`;
            errText += `- 💗 \`Format\` ➜ _Native 512x512 WebP Signal Sticker_\n`;
            errText += `- 🥹 \`Tip\` ➜ ||Works on both inbox and group chats||`;
            errText += `${config.FOOTER || '\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ﹫ᴋᴄᴇʏ • ᴅᴀʀᴋ ᴛᴇᴄʜ ᴢᴏɴᴇ'}`;
            return await reply(errText);
        }

        await react('⏳');
        await fs.ensureDir(packDir);

        const vf = 'scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000';
        await execFileAsync(FFMPEG_PATH, [
            '-y',
            '-i', mediaAtt.localPath,
            '-vcodec', 'libwebp',
            '-vf', vf,
            '-lossless', '0',
            '-q:v', '75',
            '-preset', 'picture',
            '-an',
            outWebp
        ], { timeout: 25000 });

        if (!(await fs.pathExists(outWebp))) {
            throw new Error('WebP conversion failed.');
        }

        const manifest = {
            title: 'KCeY Sticker Pack',
            author: 'KCeY - Dark Tech Zone',
            cover: { id: 0, emoji: '🎀', file: '0.webp' },
            stickers: [
                { id: 0, emoji: '🎀', file: '0.webp' }
            ]
        };
        await fs.writeJson(manifestPath, manifest);

        const uploadRes = await conn.rpcCall('uploadStickerPack', {
            path: manifestPath
        });

        let packId = uploadRes?.packId || uploadRes?.stickerPackId || uploadRes?.pack_id;

        if (!packId && uploadRes?.url) {
            const idMatch = uploadRes.url.match(/pack_id=([a-fA-F0-9]+)/);
            if (idMatch) packId = idMatch[1];
        }

        if (!packId) {
            throw new Error('Failed to upload sticker pack.');
        }

        await conn.sendMessage(from, {
            sticker: `${packId}:0`
        }, { quoted: mek });

        await react('💗');
    } catch (e) {
        await react('❌');

        let failText = `🎀 *KCeY • Sticker Maker* 🤍\n\n`;
        failText += `⛔ *Sticker Creation Failed!*\n`;
        failText += `- 🥕 \`Reason\` ➜ _${e.message}_\n`;
        failText += `- 🥹 \`Note\` ➜ ||Try again with a smaller JPG or PNG image||`;
        failText += `${config.FOOTER || '\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ﹫ᴋᴄᴇʏ • ᴅᴀʀᴋ ᴛᴇᴄʜ ᴢᴏɴᴇ'}`;

        await reply(failText);
    } finally {
        setTimeout(() => {
            fs.remove(packDir).catch(() => {});
        }, 10000);
    }
});
