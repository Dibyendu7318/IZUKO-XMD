// === demote.js ===
module.exports = {
  pattern: "demote",
  desc: "Demote an admin to member (Admin/Owner Only)",
  category: "group",
  react: "⬇️",
  filename: __filename,
  use: ".demote @user OR reply to a user",

  execute: async (conn, message, m, { from, isGroup, reply, sender }) => {
    try {
      if (!isGroup) return reply("❌ 𝐓ʜɪꜱ 𝐂ᴏᴍᴍᴀɴᴅ 𝐂ᴀɴ 𝐎ɴʟʏ 𝐁ᴇ 𝐔ꜱᴇᴅ 𝐈ɴ 𝐆ʀᴏᴜᴩꜱ.");

      let metadata;
      try {
        metadata = await conn.groupMetadata(from);
      } catch {
        return reply("❌ 𝐅ᴀɪʟᴇᴅ 𝐓ᴏ 𝐆ᴇᴛ 𝐆ʀᴏᴜᴩ 𝐈ɴꜰᴏʀᴍᴀᴛɪᴏɴ.");
      }

      const participant = metadata.participants.find(p => p.id === sender);
      const isAdmin = participant?.admin === "admin" || participant?.admin === "superadmin";
      const isOwner = conn.user.id.split(":")[0] === sender.split("@")[0];
      if (!isAdmin && !isOwner) return reply("❌ 𝐎ɴʟʏ 𝐀ᴅᴍɪɴꜱ 𝐂ᴀɴ 𝐔ꜱᴇ 𝐓ʜɪꜱ 𝐂ᴏᴍᴍᴀɴᴅ.");

      // Find target: mention > reply
      let target = null;
      if (m.mentionedJid && m.mentionedJid.length > 0) {
        target = m.mentionedJid[0];
      } else if (m.quoted) {
        target = m.quoted.sender;
      }

      if (!target) return reply("❌ 𝐌ᴇɴᴛɪᴏɴ 𝐎𝐑 𝐑ᴇᴩʟʏ 𝐓ᴏ ᴀ 𝐔ꜱᴇʀ 𝐓ᴏ 𝐃ᴇᴍᴏᴛᴇ.");

      await conn.groupParticipantsUpdate(from, [target], "demote");
      await conn.sendMessage(from, { react: { text: "✅", key: message.key } });
      await conn.sendMessage(from, {
        text: `⬇️ 𝐒ᴜᴄᴄᴇꜱꜱꜰᴜʟʟʏ 𝐃ᴇᴍᴏᴛᴇᴅ @${target.split("@")[0]} 𝐅ʀᴏᴍ 𝐓ʜᴇ 𝐀ᴅᴍɪɴ`,
        mentions: [target]
      }, { quoted: message });

    } catch (e) {
      console.error("Demote error:", e);
      await conn.sendMessage(from, { react: { text: "❌", key: message.key } });
      reply("⚠️ Failed to demote user.");
    }
  }
};
