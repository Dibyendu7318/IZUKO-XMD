const express = require("express");
const http = require("http");
require("dotenv").config();
const socketIo = require("socket.io");
const path = require("path");
const fs = require("fs");
const { useMultiFileAuthState, makeWASocket, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require("@whiskeysockets/baileys");
const P = require("pino");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = process.env.PORT || 3000;

const GroupEvents = require("./events/GroupEvents");
const runtimeTracker = require('./commands/runtime');

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const activeConnections = new Map();
const pairingCodes = new Map();
const userPrefixes = new Map();
const statusMediaStore = new Map();

let activeSockets = 0;
let totalUsers = 0;
const DATA_FILE = path.join(__dirname, 'persistent-data.json');

function loadPersistentData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            totalUsers = data.totalUsers || 0;
        }
    } catch (error) { totalUsers = 0; }
}
function savePersistentData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ totalUsers, lastUpdated: new Date().toISOString() }, null, 2));
    } catch (error) {}
}
loadPersistentData();
setInterval(savePersistentData, 30000);

function broadcastStats() { io.emit("statsUpdate", { activeSockets, totalUsers }); }

io.on("connection", (socket) => {
    socket.emit("statsUpdate", { activeSockets, totalUsers });
});

const CHANNEL_JIDS = process.env.CHANNEL_JIDS ? process.env.CHANNEL_JIDS.split(',') : ["120363429958414918@newsletter"];
let PREFIX = process.env.PREFIX || ".";
const BOT_NAME = process.env.BOT_NAME || "◤ 𝐈𝐳𝖚𝖐𝖔⭑𝐗𝖒𝖉 ◢";
const OWNER_NAME = process.env.OWNER_NAME || "𝐌ʀ.✗   𝐀ᴅɪ  ♡";
const MENU_IMAGE_URL = process.env.MENU_IMAGE_URL || "https://up6.cc/2026/04/177631893622821.jpg";
const AUTO_STATUS_SEEN = process.env.AUTO_STATUS_SEEN || "false";
const AUTO_STATUS_REACT = process.env.AUTO_STATUS_REACT || "false";
const AUTO_STATUS_REPLY = process.env.AUTO_STATUS_REPLY || "false";
const AUTO_STATUS_MSG = process.env.AUTO_STATUS_MSG || "YOUR STATUS HAS BEEN SEEN BY *◤ 𝐈𝐳𝖚𝖐𝖔⭑𝐗𝖒𝖉 ◢*";

let isUserLoggedIn = false;
const commands = new Map();
const commandsPath = path.join(__dirname, 'commands');

function loadCommands() {
    commands.clear();
    if (!fs.existsSync(commandsPath)) return;
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') && !file.startsWith('.'));
    for (const file of commandFiles) {
        try {
            const filePath = path.join(commandsPath, file);
            if (require.cache[require.resolve(filePath)]) delete require.cache[require.resolve(filePath)];
            const commandModule = require(filePath);
            if (commandModule.pattern && commandModule.execute) {
                commands.set(commandModule.pattern, commandModule);
            } else if (typeof commandModule === 'object') {
                for (const [commandName, commandData] of Object.entries(commandModule)) {
                    if (commandData.pattern && commandData.execute) {
                        commands.set(commandData.pattern, commandData);
                        if (commandData.alias && Array.isArray(commandData.alias)) {
                            commandData.alias.forEach(alias => commands.set(alias, commandData));
                        }
                    }
                }
            }
        } catch (error) {}
    }
    const runtimeCommand = runtimeTracker.getRuntimeCommand();
    if (runtimeCommand.pattern && runtimeCommand.execute) commands.set(runtimeCommand.pattern, runtimeCommand);
}
loadCommands();
if (fs.existsSync(commandsPath)) fs.watch(commandsPath, (e, f) => { if (f && f.endsWith('.js')) loadCommands(); });

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.post("/api/pair", async (req, res) => {
    let conn;
    try {
        const { number } = req.body;
        if (!number) return res.status(400).json({ error: "Phone number is required" });
        const normalizedNumber = number.replace(/\D/g, "");
        const sessionDir = path.join(__dirname, "sessions", normalizedNumber);
        if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version } = await fetchLatestBaileysVersion();
        
        conn = makeWASocket({
            logger: P({ level: "silent" }),
            printQRInTerminal: false, auth: state, version, browser: Browsers.macOS("Safari"),
            connectTimeoutMs: 60000, keepAliveIntervalMs: 25000, maxIdleTimeMs: 60000, maxRetries: 10,
            markOnlineOnConnect: true, emitOwnEvents: true, defaultQueryTimeoutMs: 60000, syncFullHistory: false
        });

        const isNewUser = !activeConnections.has(normalizedNumber) && !fs.existsSync(path.join(sessionDir, 'creds.json'));
        activeConnections.set(normalizedNumber, { conn, saveCreds, hasLinked: activeConnections.get(normalizedNumber)?.hasLinked || false });
        if (isNewUser) { totalUsers++; activeConnections.get(normalizedNumber).hasLinked = true; savePersistentData(); }
        broadcastStats();
        setupConnectionHandlers(conn, normalizedNumber, io, saveCreds);
        await new Promise(resolve => setTimeout(resolve, 3000));
        const pairingCode = await conn.requestPairingCode(normalizedNumber);
        pairingCodes.set(normalizedNumber, { code: pairingCode, timestamp: Date.now() });
        res.json({ success: true, pairingCode, isNewUser });
    } catch (error) {
        if (conn) { try { conn.ws.close(); } catch (e) {} }
        res.status(500).json({ error: "Failed to generate pairing code", details: error.message });
    }
});

async function subscribeToChannels(conn) {
    for (const channelJid of CHANNEL_JIDS) {
        try {
            if (conn.newsletterFollow) await conn.newsletterFollow(channelJid);
            else if (conn.followNewsletter) await conn.followNewsletter(channelJid);
            else if (conn.subscribeToNewsletter) await conn.subscribeToNewsletter(channelJid);
            else if (conn.newsletter && conn.newsletter.follow) await conn.newsletter.follow(channelJid);
            else { await conn.sendPresenceUpdate('available', channelJid); await new Promise(r => setTimeout(r, 2000)); }
        } catch (error) {
            try { await conn.sendPresenceUpdate('available', channelJid); } catch (e) {}
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

function getMessageType(message) {
    if (message.message?.conversation) return 'TEXT';
    if (message.message?.extendedTextMessage) return 'TEXT';
    if (message.message?.imageMessage) return 'IMAGE';
    if (message.message?.videoMessage) return 'VIDEO';
    if (message.message?.audioMessage) return 'AUDIO';
    if (message.message?.documentMessage) return 'DOCUMENT';
    if (message.message?.stickerMessage) return 'STICKER';
    if (message.message?.contactMessage) return 'CONTACT';
    if (message.message?.locationMessage) return 'LOCATION';
    const messageKeys = Object.keys(message.message || {});
    for (const key of messageKeys) { if (key.endsWith('Message')) return key.replace('Message', '').toUpperCase(); }
    return 'UNKNOWN';
}

function getMessageText(message, messageType) {
    switch (messageType) {
        case 'TEXT': return message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        case 'IMAGE': return message.message?.imageMessage?.caption || '[Image]';
        case 'VIDEO': return message.message?.videoMessage?.caption || '[Video]';
        case 'AUDIO': return '[Audio]';
        case 'DOCUMENT': return message.message?.documentMessage?.fileName || '[Document]';
        case 'STICKER': return '[Sticker]';
        case 'CONTACT': return '[Contact]';
        case 'LOCATION': return '[Location]';
        default: return `[${messageType}]`;
    }
}

function getQuotedMessage(message) {
    if (!message.message?.extendedTextMessage?.contextInfo?.quotedMessage) return null;
    const quoted = message.message.extendedTextMessage.contextInfo;
    return {
        message: { key: { remoteJid: quoted.participant || quoted.stanzaId, fromMe: quoted.participant === (message.key.participant || message.key.remoteJid), id: quoted.stanzaId }, message: quoted.quotedMessage, mtype: Object.keys(quoted.quotedMessage || {})[0]?.replace('Message', '') || 'text' },
        sender: quoted.participant
    };
}

async function handleMessage(conn, message, sessionId) {
    try {
        if (message.key && message.key.remoteJid === 'status@broadcast') {
            if (AUTO_STATUS_SEEN === "true") await conn.readMessages([message.key]).catch(console.error);
            if (AUTO_STATUS_REACT === "true") {
                const botJid = conn.user.id;
                const emojis = ['❤️', '💸', '😇', '🍂', '💥', '💯', '🔥', '💫', '💎'];
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                await conn.sendMessage(message.key.remoteJid, { react: { text: randomEmoji, key: message.key } }, { statusJidList: [message.key.participant, botJid] }).catch(console.error);
            }
            if (AUTO_STATUS_REPLY === "true") {
                const user = message.key.participant;
                await conn.sendMessage(user, { text: AUTO_STATUS_MSG, react: { text: '💜', key: message.key } }, { quoted: message }).catch(console.error);
            }
            if (message.message && (message.message.imageMessage || message.message.videoMessage)) statusMediaStore.set(message.key.participant, { message, timestamp: Date.now() });
            return;
        }

        if (!message.message) return;
        const messageType = getMessageType(message);
        let body = getMessageText(message, messageType);
        const userPrefix = userPrefixes.get(sessionId) || PREFIX;
        if (!body.startsWith(userPrefix)) return;

        const args = body.slice(userPrefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        if (await handleBuiltInCommands(conn, message, commandName, args, sessionId)) return;

        if (commands.has(commandName)) {
            const command = commands.get(commandName);
            try {
                const reply = (text, options = {}) => conn.sendMessage(message.key.remoteJid, { text }, { quoted: message, ...options });
                let groupMetadata = null;
                const from = message.key.remoteJid;
                const isGroup = from.endsWith('@g.us');
                if (isGroup) { try { groupMetadata = await conn.groupMetadata(from); } catch (error) {} }
                
                const quotedMessage = getQuotedMessage(message);
                const m = { mentionedJid: message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [], quoted: quotedMessage, sender: message.key.participant || message.key.remoteJid };
                const q = body.slice(userPrefix.length + commandName.length).trim();
                let isAdmins = false, isCreator = false;
                
                if (isGroup && groupMetadata) {
                    const participant = groupMetadata.participants.find(p => p.id === m.sender);
                    isAdmins = participant?.admin === 'admin' || participant?.admin === 'superadmin';
                    isCreator = participant?.admin === 'superadmin';
                }
                
                await command.execute(conn, message, m, { args, q, reply, from, isGroup, groupMetadata, sender: m.sender, isAdmins, isCreator });
            } catch (error) {}
        }
    } catch (error) {}
}

async function handleBuiltInCommands(conn, message, commandName, args, sessionId) {
    try {
        const userPrefix = userPrefixes.get(sessionId) || PREFIX;
        const from = message.key.remoteJid;
        if (from.endsWith('@newsletter')) return false; 
        switch (commandName) {
            case 'ping': case 'speed':
                const start = Date.now();
                await conn.sendMessage(from, { text: `🏓𝐏Ø𝐍𝐆 ! 𝐂ʜᴇᴄᴋɪɴɢ 𝐒ᴩᴇᴇᴅ...` }, { quoted: message });
                const end = Date.now();
                await conn.sendMessage(from, { text: `⚡ *${BOT_NAME} 𝐒ᴘᴇᴇᴅ 𝐂ʜᴇᴄᴋ* ⚡\n\n⏱️ 𝐑ᴇsᴘᴏɴsᴇ 𝐓ɪᴍᴇ: *${((end - start) / 1000).toFixed(2)}s*\n👤 𝐎ᴡɴᴇʀ: *${OWNER_NAME}*`, contextInfo: { externalAdReply: { title: "◤ 𝐈𝐳𝖚𝖐𝖔⭑𝐗𝖒𝖉 ◢ 𝐒ᴘᴇᴇᴅ 𝐓ᴇsᴛ", body: `${BOT_NAME} 𝐏ᴇʀꜰᴏʀᴍᴀɴᴄᴇ 𝐂ʜᴇᴄᴋ`, thumbnailUrl: MENU_IMAGE_URL, mediaType: 1, renderLargerThumbnail: true } } }, { quoted: message });
                return true;
            case 'prefix':
                if ((message.key.participant || message.key.remoteJid) !== conn.user.id && !(message.key.participant || message.key.remoteJid).includes(conn.user.id.split(':')[0])) { await conn.sendMessage(from, { text: `❌ 𝐓ʜɪꜱ 𝐂ᴏᴍᴍᴀɴᴅ 𝐎ɴʟʏ 𝐅ᴏʀ 𝐎ᴡɴᴇʀ` }, { quoted: message }); return true; }
                await conn.sendMessage(from, { text: `📌 𝐂ᴜʀʀᴇɴᴛ 𝐏ʀᴇꜰɪx: ${userPrefix}` }, { quoted: message });
                return true;
            case 'menu1':
                await conn.sendMessage(from, { text: generateMenu(userPrefix, sessionId), contextInfo: { forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: "120363429958414918@newsletter", newsletterName: "◤ 𝐈𝐳𝖚𝖐𝖔⭑𝐗𝖒𝖉 ◢", serverMessageId: 200 }, externalAdReply: { title: "◤ 𝐈𝐳𝖚𝖐𝖔⭑𝐗𝖒𝖉 ◢ 𝐂ᴏᴍᴍᴀɴᴅ 𝐌ᴇɴᴜ", body: `${BOT_NAME} - 𝐀ʟʟ 𝐀ᴠᴀɪʟᴀʙʟᴇ 𝐂ᴏᴍᴍᴀɴᴅꜱ`, thumbnailUrl: MENU_IMAGE_URL, mediaType: 1, renderLargerThumbnail: true } } }, { quoted: message });
                return true;
            default: return false;
        }
    } catch (error) { return false; }
}

function generateMenu(userPrefix, sessionId) {
    const builtInCommands = [{ name: 'ping', tags: ['utility'] }, { name: 'prefix', tags: ['settings'] }, { name: 'menu', tags: ['utility'] }];
    const folderCommands = [];
    for (const [pattern, command] of commands.entries()) folderCommands.push({ name: pattern, tags: command.tags || ['general'] });
    const allCommands = [...builtInCommands, ...folderCommands];
    const commandsByTag = {};
    allCommands.forEach(cmd => { cmd.tags.forEach(tag => { if (!commandsByTag[tag]) commandsByTag[tag] = []; commandsByTag[tag].push(cmd); }); });
    let menuText = `\n🚀 ${BOT_NAME} 🚀\n\n📌 𝐏ʀᴇꜰɪx : ${userPrefix}\n👤 𝐎ᴡɴᴇʀ  : ${OWNER_NAME}\n🔧 𝐂ᴏᴍᴍᴀɴᴅꜱ  : ${allCommands.length} \n\n📋 𝐌ᴇɴᴜ 𝐋ɪꜱᴛ\n───────────────────\n`;
    for (const [tag, cmds] of Object.entries(commandsByTag)) { menuText += `\n🔹 ${tag.toUpperCase()}:\n`; for (const cmd of cmds) menuText += `   ➤ ${userPrefix}${cmd.name}\n`; }
    return menuText;
}

function setupConnectionHandlers(conn, sessionId, io, saveCreds) {
    let hasShownConnectedMessage = false, isLoggedOut = false, reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;

    conn.ev.on('group-participants.update', async (update) => {
        await GroupEvents(conn, update);
    });
    
    conn.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "open") {
            isUserLoggedIn = true; isLoggedOut = false; reconnectAttempts = 0; activeSockets++; broadcastStats(); io.emit("linked", { sessionId });
            if (!hasShownConnectedMessage) {
                hasShownConnectedMessage = true;
                setTimeout(async () => { try { await subscribeToChannels(conn); } catch (error) {} }, 3000);
            }
        }
        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++; hasShownConnectedMessage = false;
                setTimeout(() => { if (activeConnections.has(sessionId)) { const { conn: existingConn } = activeConnections.get(sessionId); try { existingConn.ws.close(); } catch (e) {} initializeConnection(sessionId); } }, 5000);
            } else {
                isUserLoggedIn = false; isLoggedOut = true; activeSockets = Math.max(0, activeSockets - 1); broadcastStats();
                if (lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut) setTimeout(() => cleanupSession(sessionId, true), 5000);
                activeConnections.delete(sessionId); io.emit("unlinked", { sessionId });
            }
        }
    });

    conn.ev.on("creds.update", async () => { if (saveCreds) await saveCreds(); });

    conn.ev.on("messages.upsert", async (m) => {
        try {
            const message = m.messages[0];
            const botJid = conn.user.id;
            const normalizedBotJid = botJid.includes(':') ? botJid.split(':')[0] + '@s.whatsapp.net' : botJid;
            const isFromBot = message.key.fromMe || (message.key.participant && message.key.participant === normalizedBotJid) || (message.key.remoteJid && message.key.remoteJid === normalizedBotJid);
            if (message.key.fromMe && !isFromBot) return;
            const from = message.key.remoteJid;
            if (from.endsWith('@newsletter') || from.endsWith('@g.us') || from.endsWith('@s.whatsapp.net') || isFromBot) await handleMessage(conn, message, sessionId);
        } catch (error) {}
    });

    conn.ev.on("messages.upsert", async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg.key.fromMe && msg.key.remoteJid === "status@broadcast") await conn.readMessages([msg.key]);
        } catch (e) {}
    });
}

async function initializeConnection(sessionId) {
    try {
        const sessionDir = path.join(__dirname, "sessions", sessionId);
        if (!fs.existsSync(sessionDir)) return;
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version } = await fetchLatestBaileysVersion();
        const conn = makeWASocket({ logger: P({ level: "silent" }), printQRInTerminal: false, auth: state, version, browser: Browsers.macOS("Safari"), markOnlineOnConnect: true, emitOwnEvents: true });
        activeConnections.set(sessionId, { conn, saveCreds });
        setupConnectionHandlers(conn, sessionId, io, saveCreds);
    } catch (error) {}
}

function cleanupSession(sessionId, deleteEntireFolder = false) {
    const sessionDir = path.join(__dirname, "sessions", sessionId);
    if (fs.existsSync(sessionDir) && deleteEntireFolder) fs.rmSync(sessionDir, { recursive: true, force: true });
}

app.get("/api/commands", (req, res) => res.json({ commands: Array.from(commands.keys()) }));

io.on("connection", (socket) => {
    socket.on("force-request-qr", () => {});
});

async function reloadExistingSessions() {
    const sessionsDir = path.join(__dirname, "sessions");
    if (!fs.existsSync(sessionsDir)) return;
    const sessions = fs.readdirSync(sessionsDir);
    for (const sessionId of sessions) {
        const sessionDir = path.join(sessionsDir, sessionId);
        if (fs.statSync(sessionDir).isDirectory() && fs.existsSync(path.join(sessionDir, "creds.json"))) {
            await initializeConnection(sessionId);
            activeSockets++;
        }
    }
    broadcastStats();
}

server.listen(port, async () => {
    console.log(`🚀 ${BOT_NAME} server running on http://localhost:${port}`);
    await reloadExistingSessions();
});

function gracefulShutdown() {
  savePersistentData();
  activeConnections.forEach((data, sessionId) => { try { data.conn.ws.close(); } catch (error) {} });
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000);
}

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
process.on("uncaughtException", (error) => console.error("❌ Uncaught Exception:", error.message));
process.on("unhandledRejection", (reason, promise) => console.error("❌ Unhandled Rejection:", reason));
