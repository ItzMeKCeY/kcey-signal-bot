/**
 * @project  KCeY Signal Bot - JSON-RPC Signal Engine
 * @author   KCeY (ItzMeKCeY / DevRabbitZz)
 * @team     Dark Tech Zone (DTZ)
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const readline = require('readline');
const qrcode = require('qrcode-terminal');
const EventEmitter = require('events');
const config = require('../config');
const { parseSignalMessage } = require('./style');

const BASE_DIR = path.join(__dirname, '..');
const BIN_DIR = path.join(BASE_DIR, 'signal-bin');
const JAVA_DIR = path.join(BIN_DIR, 'java');
const SIGNAL_CLI_DIR = path.join(BIN_DIR, 'signal-cli');
const DATA_DIR = path.join(BASE_DIR, 'signal-data');
const JAVA_TMP_DIR = path.join(BASE_DIR, 'tmp', 'java_tmp');

const REQUIRED_JAVA_MAJOR = '25';
const JAVA_URL = `https://api.adoptium.net/v3/binary/latest/${REQUIRED_JAVA_MAJOR}/ga/linux/x64/jre/hotspot/normal/eclipse?project=jdk`;

async function getLatestSignalCliUrl() {
    try {
        const res = await axios.get('https://api.github.com/repos/AsamK/signal-cli/releases/latest', {
            headers: { 'User-Agent': 'KCeY-Signal-Bot-DTZ' }
        });
        const version = res.data.tag_name.replace(/^v/, '');
        const asset = res.data.assets.find(a => a.name === `signal-cli-${version}.tar.gz`);
        if (asset) return { version, url: asset.browser_download_url };
    } catch (e) {}
    return {
        version: '0.14.10',
        url: 'https://github.com/AsamK/signal-cli/releases/download/v0.14.10/signal-cli-0.14.10.tar.gz'
    };
}

async function downloadFile(url, dest) {
    const writer = fs.createWriteStream(dest);
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
        maxRedirects: 10
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

async function ensureDependencies() {
    await fs.ensureDir(BIN_DIR);
    await fs.ensureDir(DATA_DIR);
    await fs.emptyDir(JAVA_TMP_DIR);

    const localJavaBin = path.join(JAVA_DIR, 'bin', 'java');
    const javaVerFile = path.join(JAVA_DIR, '.version');
    const curJavaVer = (await fs.pathExists(javaVerFile)) ? (await fs.readFile(javaVerFile, 'utf8')).trim() : '';

    if (!(await fs.pathExists(localJavaBin)) || curJavaVer !== REQUIRED_JAVA_MAJOR) {
        console.log(`[KCeY-DTZ] Downloading OpenJDK ${REQUIRED_JAVA_MAJOR} JRE...`);
        await fs.remove(JAVA_DIR);
        const javaTar = path.join(BIN_DIR, 'jre.tar.gz');
        await downloadFile(JAVA_URL, javaTar);
        await fs.ensureDir(JAVA_DIR);
        execSync(`tar -xzf "${javaTar}" -C "${JAVA_DIR}" --strip-components=1`);
        await fs.remove(javaTar);
        await fs.writeFile(javaVerFile, REQUIRED_JAVA_MAJOR);
        console.log(`[KCeY-DTZ] Java ${REQUIRED_JAVA_MAJOR} ready!`);
    }

    const latest = await getLatestSignalCliUrl();
    const versionFile = path.join(SIGNAL_CLI_DIR, '.version');
    const currentVersion = (await fs.pathExists(versionFile)) ? (await fs.readFile(versionFile, 'utf8')).trim() : '';
    const signalScript = path.join(SIGNAL_CLI_DIR, 'bin', 'signal-cli');

    if (!(await fs.pathExists(signalScript)) || currentVersion !== latest.version) {
        console.log(`[KCeY-DTZ] Installing signal-cli v${latest.version}...`);
        await fs.remove(SIGNAL_CLI_DIR);
        const sigTar = path.join(BIN_DIR, 'signal-cli.tar.gz');
        await downloadFile(latest.url, sigTar);
        await fs.ensureDir(SIGNAL_CLI_DIR);
        execSync(`tar -xzf "${sigTar}" -C "${SIGNAL_CLI_DIR}" --strip-components=1`);
        await fs.remove(sigTar);
        fs.chmodSync(signalScript, '755');
        await fs.writeFile(versionFile, latest.version);
        console.log(`[KCeY-DTZ] signal-cli v${latest.version} ready!`);
    }

    const baseJavaOpts = config.JAVA_OPTS || '-Xmx450m';
    const customEnv = {
        ...process.env,
        TMPDIR: JAVA_TMP_DIR,
        JAVA_HOME: JAVA_DIR,
        PATH: `${path.join(JAVA_DIR, 'bin')}:${process.env.PATH}`,
        JAVA_OPTS: `${baseJavaOpts} -Djava.io.tmpdir="${JAVA_TMP_DIR}"`
    };

    return { signalScript, customEnv };
}

class SignalClient extends EventEmitter {
    constructor() {
        super();
        this.proc = null;
        this.botNumber = null;
        this.rpcId = 1;
        this.pendingRequests = new Map();
    }

    async isAccountRegistered(number) {
        const accountsFile = path.join(DATA_DIR, 'data', 'accounts.json');
        if (await fs.pathExists(accountsFile)) {
            try {
                const data = await fs.readJson(accountsFile);
                if (data.accounts && data.accounts.some(a => a.number === number)) return true;
            } catch {}
        }
        return false;
    }

    async linkDevice(signalScript, customEnv) {
        return new Promise((resolve, reject) => {
            console.log('\n[KCeY-DTZ] Generating Signal Link QR Code...');
            const linkProc = spawn(signalScript, ['--config', DATA_DIR, 'link', '-n', 'KCeY-Signal-Bot-DTZ'], {
                env: customEnv
            });

            const rl = readline.createInterface({ input: linkProc.stdout });
            rl.on('line', (line) => {
                const uri = line.trim();
                if (uri.startsWith('sgnl://') || uri.startsWith('tsdevice:/')) {
                    console.log('\nScan this QR Code in Signal App > Settings > Linked Devices:\n');
                    qrcode.generate(uri, { small: true });
                    console.log(`\nLink URI: ${uri}\n`);
                }
            });

            linkProc.stderr.on('data', (d) => {
                const msg = d.toString().trim();
                if (msg) console.log('[SIGNAL-CLI]:', msg);
            });

            linkProc.on('close', (code) => {
                if (code === 0) resolve(true);
                else reject(new Error(`Link failed with exit code ${code}`));
            });
        });
    }

    async start(botNumber) {
        this.botNumber = botNumber.startsWith('+') ? botNumber : `+${botNumber}`;
        const { signalScript, customEnv } = await ensureDependencies();

        const registered = await this.isAccountRegistered(this.botNumber);
        if (!registered) {
            await this.linkDevice(signalScript, customEnv);
        }

        console.log(`[KCeY-DTZ] Starting Signal JSON-RPC Daemon for ${this.botNumber}...`);
        this.proc = spawn(signalScript, [
            '--config', DATA_DIR,
            '-a', this.botNumber,
            'jsonRpc'
        ], { env: customEnv });

        const rl = readline.createInterface({ input: this.proc.stdout });

        rl.on('line', (line) => {
            if (!line.trim()) return;
            try {
                const json = JSON.parse(line);
                if (json.id && this.pendingRequests.has(json.id)) {
                    const { resolve, reject } = this.pendingRequests.get(json.id);
                    this.pendingRequests.delete(json.id);
                    if (json.error) reject(new Error(json.error.message || 'RPC Error'));
                    else resolve(json.result);
                } else if (json.method === 'receive' && json.params?.envelope) {
                    this.emit('message', json.params.envelope);
                }
            } catch (e) {}
        });

        this.proc.stderr.on('data', (data) => {
            const errStr = data.toString().trim();
            if (errStr && !errStr.includes('INFO') && !errStr.includes('WARN')) {
                console.error('[SIGNAL STDERR]:', errStr);
            }
        });

        this.proc.on('close', (code) => {
            console.log(`[KCeY-DTZ] Daemon closed (code ${code}). Reconnecting in 5s...`);
            setTimeout(() => this.start(this.botNumber), 5000);
        });

        setTimeout(() => {
            this.emit('open', this.botNumber);
        }, 2500);
    }

    rpcCall(method, params = {}) {
        return new Promise((resolve, reject) => {
            if (!this.proc || !this.proc.stdin.writable) {
                return reject(new Error('Signal daemon not ready'));
            }
            const id = this.rpcId++;
            const payload = JSON.stringify({ jsonrpc: '2.0', method, params, id });
            this.pendingRequests.set(id, { resolve, reject });
            this.proc.stdin.write(payload + '\n');

            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    resolve(null);
                }
            }, 25000);
        });
    }

    async sendMessage(chatId, content = {}, options = {}) {
        const isGroup = !chatId.startsWith('+');
        const params = {};
        if (isGroup) params.groupId = chatId;
        else params.recipient = [chatId];

        const rawMsg = content.text || content.caption || '';
        if (rawMsg) {
            const parsed = parseSignalMessage(rawMsg);
            params.message = parsed.message;
            if (parsed.textStyle && parsed.textStyle.length > 0) {
                params.textStyle = parsed.textStyle;
            }
        }

        if (content.sticker) {
            params.sticker = content.sticker;
        }

        if (content.attachments && Array.isArray(content.attachments)) params.attachments = content.attachments;
        else if (content.imagePath) params.attachments = [content.imagePath];
        else if (content.filePath) params.attachments = [content.filePath];

        if (options.quoted && options.quoted.timestamp && options.quoted.sender) {
            params.quoteTimestamp = options.quoted.timestamp;
            params.quoteAuthor = options.quoted.sender;
            if (options.quoted.body) {
                const parsedQuote = parseSignalMessage(options.quoted.body);
                params.quoteMessage = parsedQuote.message;
            }
        }
        return await this.rpcCall('send', params);
    }

    async sendReaction(chatId, emoji, targetAuthor, targetTimestamp, remove = false) {
        const isGroup = !chatId.startsWith('+');
        const params = { emoji, targetAuthor, targetTimestamp, remove };
        if (isGroup) params.groupId = chatId;
        else params.recipient = [chatId];
        return await this.rpcCall('sendReaction', params);
    }

    async sendTyping(chatId, stop = false) {
        const isGroup = !chatId.startsWith('+');
        const params = { stop };
        if (isGroup) params.groupId = chatId;
        else params.recipient = [chatId];
        return await this.rpcCall('sendTyping', params);
    }

    async sendReceipt(recipient, targetTimestamp, type = 'read') {
        return await this.rpcCall('sendReceipt', {
            recipient,
            targetTimestamp: [targetTimestamp],
            type
        });
    }
}

module.exports = SignalClient;
