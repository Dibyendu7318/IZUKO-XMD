// commands/choose.js
module.exports = {
    pattern: "choose",
    desc: "Randomly chooses one mentioned user.",
    react: "🎲",
    category: "fun",
    filename: __filename,
    execute: async (conn, mek, m, { from, isGroup, reply }) => {
        try {
            if (!isGroup) {
                return reply("❌ 𝐓ʜɪꜱ 𝐂ᴏᴍᴍᴀɴᴅ 𝐂ᴀɴ 𝐎ɴʟʏ 𝐁ᴇ 𝐔ꜱᴇᴅ 𝐈ɴ 𝐆ʀᴏᴜᴩꜱ.");
            }

            // React to the command
            if (module.exports.react) {
                await conn.sendMessage(from, {
                    react: { text: module.exports.react, key: mek.key }
                });
            }

            const mentioned = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

            if (mentioned.length < 2) {
                return reply("🎀 T𝐓ᴀɢ 𝐀ᴛ 𝐋ᴇᴀꜱᴛ 2 𝐔ꜱᴇʀꜱ 𝐓ᴏ 𝐂ʜᴏᴏꜱᴇ 𝐅ʀᴏᴍ!\n\nExample:\n.choose @user1 @user2");
            }

            const randomPick = mentioned[Math.floor(Math.random() * mentioned.length)];
            const message = `🎲 I  𝐂ʜᴏᴏꜱᴇ... @${randomPick.split("@")[0]} 🎉`;

            await conn.sendMessage(from, {
                text: message,
                mentions: mentioned
            }, { quoted: mek });

        } catch (error) {
            console.error("❌ 𝐄ʀʀᴏʀ 𝐈ɴ 𝐂ʜᴏᴏꜱᴇ 𝐂ᴏᴍᴍᴀɴᴅ:", error);
            reply("⚠️ ᴀɴ ᴇʀʀᴏʀ ᴏᴄᴄᴜʀʀᴇᴅ ᴡʜɪʟᴇ ᴩʀᴏᴄᴇꜱꜱɪɴɢ ᴛʜᴇ ᴄᴏᴍᴍᴀɴᴅ. ᴩʟᴇᴀꜱᴇ ᴛʀʏ ᴀɢᴀɪɴ!");
        }
    }
};
