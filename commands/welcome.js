// === welcome.js ===
module.exports = {
  pattern: "welcome",
  desc: "Toggle welcome messages (Owner/Admin only)",
  category: "group",
  react: "🎒",
  use: ".welcome on/off",
  filename: __filename,

  execute: async (conn, message, m, { q, reply, from, isGroup, sender }) => {
    try {
      // --- normalize JIDs ---
      const jidToBase = (jid) => String(jid).split("@")[0].split(":")[0];
      const senderBase = jidToBase(sender);
      const botBase = jidToBase(conn?.user?.id || "");

      // --- Owner check (from .env) ---
      let owners = [];
      if (process.env.OWNER_NUMBER) {
        owners = process.env.OWNER_NUMBER.split(",").map(num => num.trim());
      }
      const isOwner = botBase === senderBase || owners.includes(senderBase);

      // --- Admin check (only for groups) ---
      let isAdmin = false;
      if (isGroup) {
        try {
          const metadata = await conn.groupMetadata(from);
          const participant = metadata.participants.find(p => jidToBase(p.id) === senderBase);
          isAdmin = participant?.admin === "admin" || participant?.admin === "superadmin";
        } catch {
          return reply("🚫 𝐅ᴀɪʟᴇᴅ 𝐓ᴏ 𝐆ᴇᴛ 𝐆ʀᴏᴜᴩ 𝐈ɴꜰᴏʀᴍᴀᴛɪᴏɴ");
        }
      }

      // --- Permissions ---
      if (!isOwner) {
        if (isGroup) {
          if (!isAdmin) return reply("🚫 𝐎ɴʟʏ 𝐆ʀᴏᴜᴩ 𝐀ᴅᴍɪɴꜱ 𝐎𝐑 𝐓ʜᴇ 𝐁ᴏᴛ 𝐎ᴡɴᴇʀ 𝐂ᴀɴ 𝐔ꜱᴇ 𝐓ʜɪꜱ.");
        } else {
          return reply("🚫 𝐎ɴʟʏ 𝐓ʜᴇ 𝐎ᴡɴᴇʀ 𝐂ᴀɴ 𝐓ᴏɢɢʟᴇ 𝐓ʜɪꜱ 𝐈ɴ 𝐃ᴍꜱ.");
        }
      }

      // --- Toggle logic ---
      if (!q) {
        return reply(
          `⚙️ 𝐔ꜱᴀɢᴇ: \`.welcome on\` or \`.welcome off\`\n\n📡 𝐂ᴜʀʀᴇɴᴛ 𝐒ᴛᴀᴛᴜꜱ: *${process.env.WELCOME_ENABLED === "true" ? "ON ✅" : "OFF ❌"}*`
        );
      }

      if (q.toLowerCase() === "on") {
        process.env.WELCOME_ENABLED = "true";
        await conn.sendMessage(from, { react: { text: "🎒", key: message.key } });
        return reply("✅ 𝐖ᴇʟᴄᴏɴᴇ 𝐌ᴇꜱꜱᴀɢᴇꜱ 𝐄ɴᴀʙʟᴇᴅ.\n\n📡 𝐂ᴜʀʀᴇɴᴛ 𝐒ᴛᴀᴛᴜꜱ: *ON*");
      } else if (q.toLowerCase() === "off") {
        process.env.WELCOME_ENABLED = "false";
        await conn.sendMessage(from, { react: { text: "🎒", key: message.key } });
        return reply("❌ 𝐖ᴇʟᴄᴏᴍᴇ 𝐌ᴇꜱꜱᴀɢᴇꜱ 𝐃ɪꜱᴀʙʟᴇᴅ.\n\n📡 𝐂ᴜʀʀᴇɴᴛ 𝐒ᴛᴀᴛᴜꜱ: *OFF*");
      } else {
        return reply(
          `⚙️ 𝐔ꜱᴀɢᴇ: \`.welcome on\` or \`.welcome off\`\n\n📡 𝐂ᴜʀʀᴇɴᴛ 𝐒ᴛᴀᴛᴜꜱ: *${process.env.WELCOME_ENABLED === "true" ? "ON ✅" : "OFF ❌"}*`
        );
      }

    } catch (e) {
      console.error("𝐖ᴇʟᴄᴏᴍᴇ 𝐂ᴏᴍᴍᴀɴᴅ 𝐄ʀʀᴏʀ:", e);
      await conn.sendMessage(from, { react: { text: "❌", key: message.key } });
      reply("⚠️ ꜰᴀɪʟᴇᴅ ᴛᴏ ᴛᴏɢɢʟᴇ ᴡᴇʟᴄᴏᴍᴇ ᴍᴇꜱꜱᴀɢᴇꜱ.");
    }
  }
};
