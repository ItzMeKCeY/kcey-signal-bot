/**
 * @plugin   Alive Status Command
 * @author   KCeY | Dark Tech Zone (DTZ)
 */

const config = require('../config');
const { cmd } = require('../command');
const { runtime } = require('../lib/functions');

cmd({
    pattern: 'alive',
    alias: ['bot', 'active', 'status'],
    desc: 'Check KCeY Signal Bot status',
    category: 'main',
    react: '💗',
    filename: __filename
},
async (conn, mek, m, { prefix, reply, react }) => {
    try {
        await react('⏳');

        const livePrefix = prefix || config.PREFIX || '.';

        let aliveText = `🎀 *KCeY Signal Bot - System Status* 🤍\n\n`;
        aliveText += `- 💗 \`Status\` ➜ *Active & Online*\n`;
        aliveText += `- 🥕 \`Client\` ➜ *Signal Messenger*\n`;
        aliveText += `- 🫶 \`Prefix\` ➜ *[ ${livePrefix} ]*\n`;
        aliveText += `- ⏳ \`Uptime\` ➜ *${runtime(process.uptime())}*\n`;
        aliveText += `- 🥹 \`Developer\` ➜ *KCeY*\n`;
        aliveText += `- 🛡️ \`Team\` ➜ *Dark Tech Zone (DTZ)*\n`;
        aliveText += `- 🌐 \`API Hub\` ➜ _https://api.kcey.online_\n\n`;
        aliveText += `> 🤍 _Sri Lanka's First Signal Messenger Bot_`;
        aliveText += `${config.FOOTER || '\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ﹫ᴋᴄᴇʏ • ᴅᴀʀᴋ ᴛᴇᴄʜ ᴢᴏɴᴇ'}`;

        await reply(aliveText);
        await react('💗');
    } catch (e) {
        await reply(`❌ *Error:* ${e.message}`);
    }
});
