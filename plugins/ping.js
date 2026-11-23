/**
 * @plugin   Ping Command
 * @author   KCeY | Dark Tech Zone (DTZ)
 */

const config = require('../config');
const { cmd } = require('../command');

cmd({
    pattern: "ping",
    alias: ["p", "pong"],
    desc: "Check bot response speed",
    category: "main",
    react: "🥕",
    filename: __filename
},
async (conn, mek, m, { reply, react }) => {
    try {
        await react("⏳");
        const start = Date.now();
        await react("🥕");
        const ping = Date.now() - start;

        await reply(`🎀 *Pong!* \`${ping}ms\` 🤍${config.FOOTER || ''}`);
    } catch (e) {
        await reply("❌ *Error:* Failed to check ping.");
    }
});
