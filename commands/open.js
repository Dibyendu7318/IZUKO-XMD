// === open.js ===
module.exports = {
  pattern: "open",
  desc: "Open the group (Admins Only)",
  category: "group",
  react: "🔓",
  filename: __filename,
  use: ".open",

  execute: async (conn, message, m, { from, isGroup, reply, sender }) => {
    try {
      if (!isGroup) return reply("🚫 𝐓ʜɪꜱ 𝐂ᴏᴍᴍᴀɴᴅ 𝐂ᴀɴ 𝐎ɴʟʏ 𝐁ᴇ 𝐔ꜱᴇᴅ 𝐈ɴ 𝐆ʀᴏᴜᴩꜱ.");

      let metadata;
      try {
        metadata = await conn.groupMetadata(from);
      } catch {
        return reply("🚫 𝐅ᴀɪʟᴇᴅ 𝐓ᴏ 𝐆ᴇᴛ 𝐆ʀᴏᴜᴩ 𝐈ɴꜰᴏʀᴍᴀᴛɪᴏɴ.");
      }

      const participant = metadata.participants.find(p => p.id === sender);
      const isAdmin = participant?.admin === "admin" || participant?.admin === "superadmin";
      const isOwner = conn.user.id.split(":")[0] === sender.split("@")[0];
      if (!isAdmin && !isOwner) return reply("🚫 𝐎ɴʟʏ 𝐀ᴅᴍɪɴꜱ 𝐂ᴀɴ 𝐔ꜱᴇ 𝐓ʜɪꜱ 𝐂ᴏᴍᴍᴀɴᴅ.");

      // React success
      await conn.sendMessage(from, { react: { text: "✅", key: message.key } });

      // Open the group for all members with contextInfo
      await conn.groupSettingUpdate(from, "not_announcement");
      await conn.sendMessage(from, {
        text: "🔓 𝐆ɢʀᴏᴜᴏ 𝐈ꜱ 𝐍ᴏᴡ 𝐎ᴩᴇɴ. 𝐀ʟʟ 𝐌ᴇᴍʙᴇʀꜱ 𝐂ᴀɴ 𝐒ᴇɴᴅ 𝐌ᴇꜱꜱᴀɢᴇꜱ.",
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363429958414918@newsletter",
            newsletterName: "◤ 𝐈𝐳𝖚𝖐𝖔⭑𝐗𝖒𝖉 ◢",
            serverMessageId: 200
          }
        }
      }, { quoted: message });

    } catch (e) {
      console.error("𝐎ᴩᴇɴ 𝐄ʀʀᴏʀ:", e);

      // React fail
      await conn.sendMessage(from, { react: { text: "❌", key: message.key } });

      // Error with contextInfo
      reply("⚠️ ꜰᴀɪʟᴇᴅ ᴛᴏ ᴏᴩᴇɴ ɢʀᴏᴜᴩ!", {
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363429958414918@newsletter,
            newsletterName: "◤ 𝐈𝐳𝖚𝖐𝖔⭑𝐗𝖒𝖉 ◢",
            serverMessageId: 200
          }
        }
      });
    }
  }
};
