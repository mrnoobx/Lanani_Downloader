require('dotenv').config();
const axios = require('axios');

async function getAiResponse(bot, chatId, input, userName) {
  if (!input) return bot.sendMessage(chatId, `[Indonesia]\nMasukkan pertanyaan mu, contoh\n/ai apa itu javascript\n\n[English]\nEnter your question, example\n/ai what is javascript`);
  try {
    bot.sendChatAction(chatId, 'typing');
    let { data } = await axios(`https://onlinegpt.org/wp-json/mwai-ui/v1/chats/submit`, {
      method: "post",
      data: {
        botId: "default",
        newMessage: input,
        stream: false
      },
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json"
      }
    })
    if (data.success) {
      await bot.sendMessage(chatId, `${data.reply}`.trim(), { parse_mode: 'Markdown' })
    } else if (!data.success) {
      return bot.sendMessage(chatId, 'An error occurred!');
    }
  } catch (err) {
    await bot.sendMessage(String(process.env.DEV_ID), `[ ERROR MESSAGE ]\n\n• Username: @${userName}\n• File: funcs/ai.js\n• Function: getAiResponse()\n• Input: ${input}\n\n${err}`.trim());
    return bot.sendMessage(chatId, 'An error occurred!');
  }
}

module.exports = {
  getAiResponse
}