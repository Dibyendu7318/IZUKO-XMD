const axios = require("axios");

module.exports = {
    pattern: "pair",
    desc: "Connect your WhatsApp to ɪᴢᴜᴋᴏ-xᴍᴅ for enhanced features",
    react: "💓",
    category: "utility",
    filename: __filename,

    execute: async (conn, mek, m, { from, args, q, reply }) => {
        // Helper function to send messages with contextInfo
        const sendMessageWithContext = async (text, quoted = mek) => {
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
            // React with key emoji
            if (module.exports.react) {
                await conn.sendMessage(from, { react: { text: module.exports.react, key: mek.key } });
            }

            const pairingMessage = `🔑 *ɪᴢᴜᴋᴏ-xᴍᴅ 𝐏ᴀɪʀɪɴɢ 𝐈ɴᴀᴛʀᴜᴄᴛɪᴏɴ* 🔑\n\n` +
                                `🌐 *𝐏ᴀɪʀɪɴɢ 𝐋ɪɴᴋ:* https://qadeerxtech.onrender.com\n\n` +
                                `📋 *𝐇ᴏᴡ 𝐓ᴏ 𝐂ᴏɴɴᴇᴄᴛ:*\n` +
                                `𝟏. 𝐄ɴᴛᴇʀ 𝐘ᴏᴜʀ 𝐖ʜᴀᴛꜱ𝐀ᴩᴩ 𝐍ᴜᴍʙᴇʀ 𝐖ɪᴛʜ 𝐂ᴏᴜɴᴛʀʏ 𝐂ᴏᴅᴇ (𝐍ᴏ "+", 𝐍ᴏ 𝐁ʀᴀᴄᴋᴇᴛꜱ, 𝐍ᴏ 𝐒ᴩᴀᴄᴇꜱ)\n` +
                                `𝟐. 𝐂ʟɪᴄᴋ "𝐑ᴇqᴜᴇꜱᴛ 𝐏ᴀɪʀɪɴɢ Cᴏᴅᴇ"\n` +
                                `𝟑. 𝐂ᴏᴩʏ 𝐓ʜᴇ 8-𝐃ɪɢɪᴛ 𝐂ᴏᴅᴇ\n` +
                                `𝟒. 𝐎ᴩᴇɴ 𝐖ʜᴀᴛꜱ𝐀ᴩᴩ → 𝐒ᴇᴛᴛɪɴɢꜱ → 𝐋ɪɴᴋᴇᴅ 𝐃ᴇᴠɪᴄᴇꜱ → 𝐋ɪɴᴋ ᴀ 𝐃ᴇᴠɪᴄᴇ\n` +
                                `𝟓. 𝐏ᴀꜱᴛᴇ 𝐓ʜᴇ 𝐂ᴏᴅᴇ 𝐖ʜᴇɴ 𝐏ʀᴏᴍᴩᴛᴇᴅ\n\n` +
                                `💡 *𝐄xᴀᴍᴩʟᴇ:*\n` +
                                `𝐍ᴜᴍʙᴇʀ: 𝟗𝟏𝟕𝟑𝟏𝟖𝟖𝟏𝟐𝟑𝟑𝟖 (𝐅ᴏʀ 𝐔𝐒 𝐍ᴜᴍʙᴇʀ)\n` +
                                `𝐅ᴏʀᴍᴀᴛ: 𝐂ᴏᴜɴᴛʀʏ 𝐂ᴏᴅᴇ + 𝐍ᴜᴍʙᴇʀ 𝐖ɪᴛʜᴏᴜᴛ 𝐒ᴩᴀᴄᴇꜱ/𝐒ʏᴍʙᴏʟꜱ\n\n` +
                                `✅ *𝐁ᴇɴᴇꜰɪᴛꜱ:*\n` +
                                `• 𝐄ɴʜᴀɴᴄᴇᴅ 𝐌ᴇᴅɪᴀ 𝐃ᴏᴡɴʟᴏᴀᴅɪɴɢ\n` +
                                `• 𝐁ᴇᴛᴛᴇʀ 𝐐ᴜᴀʟɪᴛʏ 𝐀ᴜᴅɪᴏ/𝐕ɪᴅᴇᴏ\n` +
                                `• 𝐎ᴩᴇɴꜱ 𝐕ɪᴇᴡ 𝐎ɴᴄᴇ \n\n` +
                                `> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɪᴢᴜᴋᴏ/xᴍᴅ !*`;

            await sendMessageWithContext(pairingMessage);

        } catch (e) {
            console.error("❌ 𝐏ᴀɪʀ 𝐂ᴏᴍᴍᴀɴᴅ 𝐄ʀʀᴏʀ:", e.message);
            await sendMessageWithContext(`⚠️ ᴇʀʀᴏʀ: ${e.message}`);
        }
    }
};