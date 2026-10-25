// === hidetag.js ===
module.exports = {
  pattern: "hidetag",
  desc: "Tag all members for any message/media - everyone can use",
  category: "group",
  use: ".hidetag [message] or reply to a message",
  filename: __filename,

  execute: async (conn, message, m, { q, reply, from, isGroup }) => {
    try {
      if (!isGroup) return reply("❌ 𝐓ʜɪꜱ 𝐂ᴏᴍᴍᴀɴᴅ 𝐂ᴀɴ 𝐎ɴʟʏ 𝐁ᴇ 𝐔ꜱᴇᴅ 𝐈ɴ 𝐆ʀᴏᴜᴩꜱ.");

      // --- fetch group metadata ---
      let metadata;
      try {
        metadata = await conn.groupMetadata(from);
      } catch {
        return reply("❌ 𝐅ᴀɪʟᴇᴅ 𝐓ᴏ 𝐆ᴇᴛ 𝐆ʀᴏᴜᴩ 𝐈ɴꜰᴏʀᴍᴀᴛɪᴏɴ.");
      }

      // --- mentions list ---
      const participants = metadata.participants.map(p => p.id);

      if (!q && !m.quoted) return reply("✉️ 𝐏ʀᴏᴠɪᴅᴇ ᴀ 𝐌ᴇꜱꜱᴀɢᴇ 𝐎𝐑 𝐑ᴇᴩʟʏ 𝐓ᴏ ᴀ 𝐌ᴇꜱꜱᴀɢᴇ.");

      // React 👀
      await conn.sendMessage(from, { react: { text: "👀", key: message.key } });

      // --- reply case ---
      if (m.quoted) {
        return await conn.sendMessage(
          from,
          { forward: m.quoted.message, mentions: participants },
          { quoted: message }
        );
      }

      // --- text case ---
      if (q) {
        return await conn.sendMessage(
          from,
          { text: q, mentions: participants },
          { quoted: message }
        );
      }

    } catch (e) {
      console.error("𝐇ɪᴅᴇᴛᴀɢ 𝐄ʀʀᴏʀ:", e);
      try { await conn.sendMessage(from, { react: { text: "❌", key: message.key } }); } catch {}
      reply(`⚠️ ꜰᴀɪʟᴇᴅ ᴛᴏ ꜱᴇɴᴅ ʜɪᴅᴇᴛᴀɢ.\n\n${e.message}`);
    }
  }
};