require('dotenv').config();
const axios = require('axios');

async function threadsDownload(bot, chatId, url, userName) {
  let load = await bot.sendMessage(chatId, 'Loading, please wait.');
  try {
    let get = await axios.get('https://api.threadsphotodownloader.com/v2/media?url='+url);
    let data = get.data;
    if (data.image_urls[0] && !data.video_urls[0]) {
      let results = [];
      if (data.image_urls.length == 1) {
        await bot.sendPhoto(chatId, data.image_urls[0], { caption: `Bot by @Krxuvv` });
        return bot.deleteMessage(chatId, load.message_id);
      } else {
        data.image_urls.map(maru => {
          results.push({ type: 'photo', media: maru })
        })
        let currentIndex = 0;
        while (currentIndex < results.length) {
          let mediaToSend = results.slice(currentIndex, currentIndex + 10);
          currentIndex += 10;

          if (mediaToSend.length > 0) {
            await bot.sendMediaGroup(chatId, mediaToSend, { caption: `Bot by @Krxuvv` });
          }
        }

        results.length = 0;
        await bot.deleteMessage(chatId, load.message_id);
      }
    } else if (data.video_urls[0] && !data.image_urls[0]) {
      await bot.sendVideo(chatId, data.video_urls[0].download_url, { caption: `Bot by @Krxuvv` });
      return bot.deleteMessage(chatId, load.message_id);
    } else if (!data.image_urls[0] && !data.video_urls[0]) {
      return bot.editMessageText('Failed to get data, make sure your link is valid!', { chat_id: chatId, message_id: load.message_id });
    }
  } catch (err) {
    await bot.sendMessage(String(process.env.DEV_ID), `[ ERROR MESSAGE ]\n\n• Username: @${userName}\n• File: funcs/threads.js\n• Function: threadsDownload()\n• Url: ${url}\n\n${err}`.trim());
    return bot.editMessageText('Failed to download media, make sure your link is valid!', { chat_id: chatId, message_id: load.message_id })
  }
}

module.exports = {
  threadsDownload
}