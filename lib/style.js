/**
 * @project  KCeY Signal Bot - Native Signal Text Style Engine
 * @author   KCeY | Dark Tech Zone (DTZ)
 */

function parseSignalMessage(rawText) {
    if (!rawText) return { message: '', textStyle: [] };

    const textStyle = [];
    let cleanMessage = '';
    let lastIndex = 0;

    const tokenRegex = /(\|\|([^|\n]+)\|\|)|(\*([^*\n]+)\*)|(_([^_\n]+)_)|(`([^`\n]+)`)|(~([^~\n]+)~)/g;
    let match;

    while ((match = tokenRegex.exec(rawText)) !== null) {
        cleanMessage += rawText.slice(lastIndex, match.index);
        const startOffset = cleanMessage.length;

        let innerText = '';
        let styleType = '';

        if (match[1]) {
            innerText = match[2];
            styleType = 'SPOILER';
        } else if (match[3]) {
            innerText = match[4];
            styleType = 'BOLD';
        } else if (match[5]) {
            innerText = match[6];
            styleType = 'ITALIC';
        } else if (match[7]) {
            innerText = match[8];
            styleType = 'MONOSPACE';
        } else if (match[9]) {
            innerText = match[10];
            styleType = 'STRIKETHROUGH';
        }

        cleanMessage += innerText;
        const length = innerText.length;

        if (length > 0 && styleType) {
            textStyle.push(`${startOffset}:${length}:${styleType}`);
        }

        lastIndex = match.index + match[0].length;
    }

    cleanMessage += rawText.slice(lastIndex);
    return { message: cleanMessage, textStyle };
}

const bold = (text) => `*${text}*`;
const italic = (text) => `_${text}_`;
const mono = (text) => `\`${text}\``;
const strike = (text) => `~${text}~`;
const spoiler = (text) => `||${text}||`;

module.exports = { bold, italic, mono, strike, spoiler, parseSignalMessage };
