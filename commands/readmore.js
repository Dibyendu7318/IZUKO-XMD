// === readmore.js ===
module.exports = {
  pattern: "readmore",
  desc: "Generate a Read More message.",
  category: "convert",
  use: ".readmore <text>",
  react: "📝",
  filename: __filename,

  execute: async (conn, message, m, { q, reply, from }) => {
    try {
      const inputText = q || ""; // Default text if none provided
      const readMore = String.fromCharCode(8206).repeat(4000);
      const formattedMessage = `${inputText}${readMore}`;

      // Send reaction first
      await conn.sendMessage(from, { react: { text: "📝", key: message.key } });
      
      // Send the readmore message
      await conn.sendMessage(
        from,
        { text: formattedMessage },
        { quoted: message }
      );
      
    } catch (error) {
      console.error("❌ Error in readmore command:", error);
      await conn.sendMessage(from, { react: { text: "❌", key: message.key } });
      reply("❌ An error occurred: " + error.message);
    }
  }
};
