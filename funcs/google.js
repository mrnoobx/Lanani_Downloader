require('dotenv').config()
const { search } = require('google-sr');

async function googleSearch(bot, chatId, query, userName) {
  if (!query) return bot.sendMessage(chatId, `[Indonesia]\nMasukkan query pencarian googlemu, contoh\n/google apa itu javascript\n\n[English]\nEnter your Google search query, example\n/google what is javascript`)
  bot.sendChatAction(chatId, 'typing');
  try {
    const searchResults = await search({ query: query });
    let resultS = `GOOGLE SEARCH\n\n`
    for (let i = 0;i < 5;i++) {
      resultS += `• Title: ${searchResults[i].title}\n• Link: ${searchResults[i].link}\n• Description: ${searchResults[i].description}\n\n`
    };
    return bot.sendMessage(chatId, resultS);
  } catch (err) {
    await bot.sendMessage(String(process.env.DEV_ID), `[ ERROR MESSAGE ]\n\n• Username: @${userName}\n• File: funcs/google.js\n• Function: googleSearch()\n• Input: ${query}\n\n${err}`.trim());
    return bot.sendMessage(chatId, 'An error occurred!');
  }
}

module.exports = {
  googleSearch
}