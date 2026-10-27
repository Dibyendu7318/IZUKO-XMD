const { getSetting, setSetting } = require('../Settings');

module.exports = {
  pattern: "goodbye",
  desc: "Toggle goodbye messages (Owner/Admin only)",
  category: "group",
  react: "🚤",
  use: ".goodbye on/off",
  filename: __filename,

  execute: async (conn, message, m, { q, reply, from, isGroup, sender }) => {
    try {
      const jidToBase = (jid) => String(jid).split("@")[0].split(":")[0];
      let owners = process.env.OWNER_NUMBER ? process.env.OWNER_NUMBER.split(",").map(n => n.trim()) : [];
      const isOwner = jidToBase(conn?.user?.id) === jidToBase(sender) || owners.includes(jidToBase(sender));
      
      let isAdmin = false;
      if (isGroup) {
        try {
          const metadata = await conn.groupMetadata(from);
          const participant = metadata.participants.find(p => jidToBase(p.id) === jidToBase(sender));
          isAdmin = participant?.admin === "admin" || participant?.admin === "superadmin";
        } catch { return reply("❌ 𝐅ᴀɪʟᴇᴅ 𝐓ᴏ 𝐆ᴇᴛ 𝐆ʀᴏᴜᴩ 𝐈ɴꜰᴏʀᴍᴀᴛɪᴏɴ."); }
      }

      if (!isOwner) {
        if (isGroup && !isAdmin) return reply("🚫 𝐎ɴʟʏ 𝐆ʀᴏᴜᴩ 𝐀ᴅᴍɪɴꜱ 𝐎𝐑 𝐓ʜᴇ 𝐁ᴏᴛ 𝐎ᴡɴᴇʀ 𝐂ᴀɴ 𝐔ꜱᴇ 𝐓ʜɪꜱ.");
        if (!isGroup) return reply("❌ 𝐎ɴʟʏ 𝐓ʜᴇ 𝐎ᴡɴᴇʀ 𝐂ᴀɴ 𝐓ᴏɢɢʟᴇ 𝐓ʜɪꜱ 𝐈ɴ 𝐃ᴍꜱ.");
      }

      const currentSetting = getSetting(from, "goodbye", false);

      if (!q) return reply(`⚙️ 𝐔ꜱᴀɢᴇ: \`.goodbye on\` or \`.goodbye off\`\n\n📡 𝐂ᴜʀʀᴇɴᴛ 𝐒ᴛᴀᴛᴜꜱ: *${currentSetting ? "ON ✅" : "OFF ❌"}*`);

      if (q.toLowerCase() === "on") {
        setSetting(from, "goodbye", true);
        await conn.sendMessage(from, { react: { text: "🚤", key: message.key } });
        return reply("✅ 𝐆ᴏᴏᴅʙʏᴇ 𝐌ᴇꜱꜱᴀɢᴇꜱ 𝐄ɴᴀʙʟᴇᴅ.\n📡 𝐂ᴜʀʀᴇɴᴛ 𝐒ᴛᴀᴛᴜꜱ: *ON*");
      } else if (q.toLowerCase() === "off") {
        setSetting(from, "goodbye", false);
        await conn.sendMessage(from, { react: { text: "🚤", key: message.key } });
        return reply("❌ 𝐆ᴏᴏᴅʙʏᴇ 𝐌ᴇꜱꜱᴀɢᴇꜱ 𝐃ɪꜱᴀʙʟᴇᴅ.\n📡 𝐂ᴜʀʀᴇɴᴛ 𝐒ᴛᴀᴛᴜꜱ: *OFF*");
      } else {
        return reply(`⚙️ 𝐔ꜱᴀɢᴇ: \`.goodbye on\` or \`.goodbye off\`\n📡 𝐂ᴜʀʀᴇɴᴛ 𝐒ᴛᴀᴛᴜꜱ: *${currentSetting ? "ON ✅" : "OFF ❌"}*`);
      }
    } catch (e) {
      reply("⚠️ 𝐅ᴀɪʟᴇᴅ 𝐓ᴏ 𝐓ᴏɢɢʟᴇ 𝐆ᴏᴏᴅʙʏᴇ 𝐌ᴇꜱꜱᴀɢᴇꜱ.");
    }
  }
};
