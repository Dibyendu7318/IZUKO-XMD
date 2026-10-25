module.exports = {
  pattern: "mute",
  desc: "Close the group (Admins Only)",
  category: "group",
  react: "🔒",
  filename: __filename,
  use: ".mute",

  execute: async (conn, message, m, { from, isGroup, reply, sender }) => {
    try {
      if (!isGroup) return reply("🚫 𝐓ʜɪꜱ 𝐂ᴏᴍᴍᴀɴᴅ 𝐂ᴀɴ 𝐎ɴʟʏ 𝐁ᴇ 𝐔ꜱᴇᴅ 𝐈ɴ 𝐆ʀᴏᴜᴩꜱ.");

      let metadata;
      try {
        metadata = await conn.groupMetadata(from);
      } catch {
        return reply("❌ 𝐅ᴀɪʟᴇᴅ 𝐓ᴏ 𝐆ᴇᴛ 𝐆ʀᴏᴜᴩ 𝐈ɴꜰᴏʀᴍᴀᴛɪᴏɴ.");
      }

      const participant = metadata.participants.find(p => p.id === sender);
      const isAdmin = participant?.admin === "admin" || participant?.admin === "superadmin";
      const isOwner = conn.user.id.split(":")[0] === sender.split("@")[0];
      if (!isAdmin && !isOwner) return reply("🚫 𝐎ɴʟʏ 𝐆ʀᴏᴜᴩ 𝐀ᴅᴍɪɴꜱ 𝐂ᴀɴ 𝐔ꜱᴇ 𝐓ʜɪꜱ 𝐂ᴏᴍᴍᴀɴᴅ");

      // Close the group
      await conn.groupSettingUpdate(from, "announcement");

      // React + confirm
      await conn.sendMessage(from, { react: { text: "✅", key: message.key } });
      await conn.sendMessage(from, {
        text: "🔒 𝐆ʀᴏᴜᴩ 𝐈ꜱ 𝐍ᴏᴡ 𝐂ʟᴏꜱᴇᴅ. 𝐎ɴʟʏ 𝐀ᴅᴍɪɴꜱ 𝐂ᴀɴ 𝐒ᴇɴᴅ 𝐌ᴇꜱꜱᴀɢᴇꜱ.",
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
      console.error("𝐌ᴜᴛᴇ 𝐄ʀʀᴏʀ:", e);
      await conn.sendMessage(from, { react: { text: "❌", key: message.key } });
      reply("⚠️ ꜰᴀɪʟᴇᴅ ᴛᴏ ᴍᴜᴛᴇ ᴛʜᴇ ɢʀᴏᴜᴩ!.");
    }
  }
};
