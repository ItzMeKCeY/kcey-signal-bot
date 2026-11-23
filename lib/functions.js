/**
 * @project  KCeY Signal Bot - Core Helpers
 * @author   KCeY | Dark Tech Zone (DTZ)
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const getBuffer = async (url, options = {}) => {
    try {
        const res = await axios({
            method: 'get',
            url,
            headers: {
                'DNT': 1,
                'Upgrade-Insecure-Request': 1
            },
            ...options,
            responseType: 'arraybuffer'
        });
        return Buffer.from(res.data);
    } catch (e) {
        return null;
    }
};

const getRandom = (ext) => {
    return `${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`;
};

const downloadTempFile = async (url, ext = '.bin') => {
    try {
        const tmpDir = path.join(__dirname, '../tmp');
        await fs.ensureDir(tmpDir);
        const buf = await getBuffer(url);
        if (!buf) return null;
        const filePath = path.join(tmpDir, getRandom(ext));
        await fs.writeFile(filePath, buf);
        return filePath;
    } catch (e) {
        return null;
    }
};

const h2k = (eco) => {
    const lyrik = ['', 'K', 'M', 'B', 'T', 'P', 'E'];
    const ma = Math.log10(Math.abs(eco)) / 3 | 0;
    if (ma == 0) return eco;
    const ppo = lyrik[ma];
    const scale = Math.pow(10, ma * 3);
    const scaled = eco / scale;
    let formatt = scaled.toFixed(1);
    if (/\.0$/.test(formatt)) formatt = formatt.substr(0, formatt.length - 2);
    return formatt + ppo;
};

const isUrl = (url) => {
    return url.match(
        new RegExp(
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%.+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%+.~#?&/=]*)/,
            'gi'
        )
    );
};

const runtime = (seconds) => {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const dDisplay = d > 0 ? d + (d == 1 ? ' day, ' : ' days, ') : '';
    const hDisplay = h > 0 ? h + (h == 1 ? ' hour, ' : ' hours, ') : '';
    const mDisplay = m > 0 ? m + (m == 1 ? ' minute, ' : ' minutes, ') : '';
    const sDisplay = s > 0 ? s + (s == 1 ? ' second' : ' seconds') : '';
    return (dDisplay + hDisplay + mDisplay + sDisplay) || '0 seconds';
};

const sleep = async (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchJson = async (url, options = {}) => {
    try {
        const res = await axios({
            method: 'GET',
            url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            ...options
        });
        return res.data;
    } catch (err) {
        return err;
    }
};

module.exports = {
    getBuffer,
    getRandom,
    downloadTempFile,
    h2k,
    isUrl,
    runtime,
    sleep,
    fetchJson
};
