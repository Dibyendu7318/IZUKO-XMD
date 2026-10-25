const axios = require('axios');

module.exports = {
    pattern: "inbox",
    desc: "Check your temporary email inbox",
    category: "utility",
    react: "📬",
    filename: __filename,
    use: ".inbox [session_id]",

    execute: async (conn, message, m, { from, q, reply }) => {
        // Helper function to send messages with contextInfo
        const sendMessageWithContext = async (text, quoted = message) => {
            return await conn.sendMessage(from, {
                text: text,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363429958414918@newsletter",
                        newsletterName: "◤ 𝐈𝐳𝖚𝖐𝖔⭑𝐗𝖒𝖉 ◢",
                        serverMessageId: 200
                    }
                }
            }, { quoted: quoted });
        };

        try {
            const sessionId = q;
            if (!sessionId) return await sendMessageWithContext('🔑 𝐏ʟᴇᴀꜱᴇ 𝐏ʀᴏᴠɪᴅᴇ 𝐘ᴏᴜʀ 𝐒ᴇꜱꜱɪᴏɴ 𝐈𝐃\nExample: .inbox YOUR_SESSION_ID');

            // React 📬
            if (module.exports.react) {
                await conn.sendMessage(from, { react: { text: module.exports.react, key: message.key } });
            }

            const inboxUrl = `https://apis.davidcyriltech.my.id/temp-mail/inbox?id=${encodeURIComponent(sessionId)}`;
            const response = await axios.get(inboxUrl);

            if (!response.data.success) {
                return await sendMessageWithContext('❌ 𝐈ɴᴠᴀʟɪᴅ 𝐒ᴇꜱꜱɪᴏɴ 𝐈𝐃 ᴏʀ 𝐄xᴩɪʀᴇᴅ 𝐄ᴍᴀɪʟ');
            }

            const { inbox_count, messages } = response.data;

            if (inbox_count === 0) {
                return await sendMessageWithContext('📭 Your inbox is empty');
            }

            let messageList = `📬 *𝐘ᴏᴜ 𝐇ᴀᴠᴇ ${inbox_count} 𝐌ᴇꜱꜱᴀɢᴇ(s)*\n\n`;
            messages.forEach((msg, index) => {
                messageList += `━━━━━━━━━━━━━━━━━━\n` +
                              `📌 *𝐌ᴇꜱꜱᴀɢᴇ ${index + 1}*\n` +
                              `👤 *𝐅ʀᴏᴍ:* ${msg.from}\n` +
                              `📝 *𝐒ᴜʙᴊᴇᴄᴛ:* ${msg.subject}\n` +
                              `⏰ *𝐃ᴀᴛᴇ:* ${new Date(msg.date).toLocaleString()}\n\n` +
                              `📄 *𝐂ᴏɴᴛᴇɴᴛ:*\n${msg.body}\n\n`;
            });

            await sendMessageWithContext(messageList);

        } catch (e) {
            console.error('𝐂ʜᴇᴄᴋ𝐌ᴀɪʟ 𝐄ʀʀᴏʀ:', e);
            await sendMessageWithContext(`❌ ᴇʀʀᴏʀ ᴄʜᴇᴄᴋɪɴɢ ɪɴʙᴏx: ${e.response?.data?.message || e.message}`);
        }
    }
};