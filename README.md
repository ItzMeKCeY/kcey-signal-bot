<div align="center">

<a href="https://kcey.online">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=28&duration=3000&pause=1000&color=F472B6&center=true&vCenter=true&width=750&lines=KCeY+Signal+Bot+%F0%9F%8E%80;Sri+Lanka's+First+Signal+Messenger+Bot+%F0%9F%A4%8D;Powered+by+Dark+Tech+Zone+(DTZ)+%F0%9F%A5%95;Modular+Bot+Base+%26+Plugin+Framework+%F0%9F%92%97" alt="KCeY Signal Bot Typing SVG" />
</a>

<p align="center">
  <b>Sri Lanka's First Open-Source Multi-Device Signal Messenger Bot Base</b><br>
  Engineered with Node.js, JSON-RPC <code>signal-cli</code>, Native Text Styling & Native Sticker Pack Creation.
</p>

<p align="center">
  <a href="https://github.com/ItzMeKCeY/kcey-signal-bot/stargazers"><img src="https://img.shields.io/github/stars/ItzMeKCeY/kcey-signal-bot?style=for-the-badge&color=f472b6&labelColor=18181b" alt="Stars"></a>
  <a href="https://github.com/ItzMeKCeY/kcey-signal-bot/network/members"><img src="https://img.shields.io/github/forks/ItzMeKCeY/kcey-signal-bot?style=for-the-badge&color=a78bfa&labelColor=18181b" alt="Forks"></a>
  <a href="https://api.kcey.online"><img src="https://img.shields.io/badge/KCeY_API_Hub-400%2B_Endpoints-38bdf8?style=for-the-badge&labelColor=18181b" alt="KCeY API Hub"></a>
  <a href="https://kcey.online"><img src="https://img.shields.io/badge/Team-Dark_Tech_Zone_(DTZ)-fb7185?style=for-the-badge&labelColor=18181b" alt="Dark Tech Zone"></a>
</p>

</div>

<br>

## 🎀 About This Project

**KCeY Signal Bot** is the first Sri Lankan open-source Signal Messenger automation base designed with a modular plugin system (`cmd()`), native Signal text formatting (`*bold*`, `_italic_`, `` `mono` ``, `~strike~`, `||spoiler||`), and native Signal Sticker Pack uploading.

Built for **Pterodactyl Panel** and **Linux VPS** environments with zero root permissions required - it automatically installs Portable OpenJDK 25 and the latest `signal-cli` release on first boot. 🤍

> **📌 Important Note:**
> This repository is a **clean core bot base (main structure + starter example plugins)** rather than a bloated all-in-one bot with hundreds of pre-built commands. It provides the core Signal JSON-RPC engine, native text styler, media/attachment caching, and essential example commands (`.ping`, `.alive`, `.s`) so developers can easily build, customize, and expand their own custom plugins on top of it! 🥹🫶

<br>

## 💗 Key Features

- **Auto-Dependency Setup** - Automatically downloads Portable Java 25 JRE and the latest `signal-cli` binary inside the container without root access.
- **Native Signal Text Styling** - Supports real Signal protocol styles (`*bold*`, `_italic_`, `` `monospace` ``, `~strikethrough~`, and `||spoiler||`) without messy raw symbols.
- **Native Signal Sticker Maker** - Converts replied images into 512x512 transparent WebP stickers, packages them with `manifest.json`, and uploads directly to Signal servers.
- **Modular Plugin Base** - Drop new `.js` files into `plugins/` using the familiar `cmd(...)` structure to add your own features.
- **Container Temp Isolation** - Redirects Java native libraries (`libsignal`) to local `./tmp` to prevent `/tmp` disk space errors on low-storage Pterodactyl nodes.

<br>

## 🥕 Starter Example Commands

| Command | Aliases | Category | Description |
| :--- | :--- | :--- | :--- |
| `.ping` | `.p`, `.pong` | Main | Check real-time Signal response latency |
| `.alive` | `.bot`, `.active`, `.status` | Main | Display system uptime, developer info, and bot status |
| `.s` | `.sticker`, `.stik`, `.webp` | Converter | Convert any replied photo into a native Signal Sticker |

<br>

## 🥹 Deployment Guide

### 1. Deploy on Pterodactyl Panel (Node.js Egg)
1. Download or clone this repository and upload the files to your Pterodactyl **Node.js Server** (`Node >= 18`, minimum `800MB - 1GB RAM`).
2. Start the server from the **Console** tab.
3. Wait for `npm install` and the automatic setup of Java 25 and `signal-cli` to finish.
4. Enter your Signal phone number with country code (e.g. `+947XXXXXXXX`) in the console prompt (or pre-fill `BOT_NUMBER` in `config.js`).
5. Open **Signal App > Settings > Linked Devices > +** on your phone and scan the QR code displayed in the console. 🫶

### 2. Deploy on Linux VPS / Ubuntu
```bash
git clone https://github.com/ItzMeKCeY/kcey-signal-bot.git
cd kcey-signal-bot
npm install
npm start
```

<br>

## 🤍 Configuration (`config.js`)

Edit `config.js` to customize your bot prefix, work mode, and owner numbers:

```javascript
module.exports = {
    BOT_NUMBER: "", // Optional: "+947XXXXXXXX"
    PREFIX: ".",
    WORK_MODE: "public", // public | private | inbox | group
    AUTO_READ: false,
    AUTO_REACT: false,
    AUTO_TYPING: false,
    OWNER: ["+947XXXXXXXX"],
    JAVA_OPTS: "-Xmx450m"
};
```

<br>

## 🫶 Developer & Ecosystem

Developed & maintained by **KCeY** (`ItzMeKCeY` / `DevRabbitZz`) - Lead Developer at **Dark Tech Zone (DTZ)**.

- **Portfolio & Projects:** [https://kcey.online](https://kcey.online)
- **KCeY REST API Hub (400+ Endpoints):** [https://api.kcey.online](https://api.kcey.online)
- **Team:** Dark Tech Zone (DTZ) - Sri Lanka

<br>

<div align="center">
  <sub>🎀 Made with 💗 in Sri Lanka by <b>KCeY</b> • <b>Dark Tech Zone (DTZ)</b> 🥹</sub>
</div>