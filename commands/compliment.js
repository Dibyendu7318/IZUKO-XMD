module.exports = {
  pattern: "compliment",
  desc: "Give a nice compliment",
  category: "fun",
  react: "😊",
  filename: __filename,

  execute: async (conn, mek, m, { from, isGroup, reply }) => {
    try {
      if (!isGroup) {
        return reply("❌ 𝐓ʜɪꜱ 𝐂ᴏᴍᴍᴀɴᴅ 𝐂ᴀɴ 𝐎ɴʟʏ 𝐁ᴇ 𝐔ꜱᴇᴅ 𝐈ɴ 𝐆ʀᴏᴜᴩꜱ.");
      }

      const rawTarget =
        m.mentionedJid?.[0] ||
        mek.message?.extendedTextMessage?.contextInfo?.participant;

      if (!rawTarget) {
        return reply("❌ 𝐏ʟᴇᴀꜱᴇ 𝐌ᴇɴᴛɪᴏɴ 𝐎ʀ 𝐑ᴇᴩʟʏ 𝐓ᴏ ᴀ 𝐔ꜱᴇʀ.\n𝐔ꜱᴀɢᴇ: `.compliment @user`");
      }

      const compliments = [
        "you're amazing just the way you are! 💖",
        "your smile is contagious! 😊",
        "you're a genius in your own way! 🧠",
        "you bring happiness to everyone around you! 🥰",
        "you're like human sunshine! ☀️",
        "your kindness makes the world a better place! ❤️",
        "you're unique and irreplaceable! ✨",
        "you're stronger than you think! 💪",
        "your creativity is beyond amazing! 🎨",
        "you make life more fun and interesting! 🎉",
        "you light up every room you walk into! 🌟",
        "the world is better because you’re in it 🌍💖",
        "you have a heart of pure gold 🏅💛",
        "you inspire everyone around you ✨🙌",
        "your laugh could fix the worst of days 😂💞",
        "you're proof that good people still exist 🌹",
        "being friends with you is like winning the lottery 🎰💎",
        "you’re not just special, you’re unforgettable 💫",
        "you make people feel at home, even in chaos 🏡❤️",
        "you’re the kind of person everyone deserves in their life 💕",
      ];

      const randomCompliment = compliments[Math.floor(Math.random() * compliments.length)];
      const message = `😊 @${rawTarget.split("@")[0]} ${randomCompliment}`;

      // React first
      if (module.exports.react) {
        await conn.sendMessage(from, {
          react: { text: module.exports.react, key: mek.key }
        });
      }

      // Send compliment message
      await conn.sendMessage(from, {
        text: message,
        mentions: [rawTarget],
      }, { quoted: mek });

    } catch (e) {
      console.error("Error in compliment.js:", e);
      reply("⚠️ Failed to send compliment.");
    }
  },
};
