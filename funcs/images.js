require('dotenv').config();
let fs = require('fs');
let {
   TelegraPh,
   Pomf2Lain,
   ImageToText,
   EnhanceImage
} = require('./scraper_images.js');

async function telegraphUpload(bot, chatId, filePath, username) {
   let load = await bot.sendMessage(chatId, `Loading, please wait`)
   try {
      let upload = await TelegraPh(filePath);
      await bot.editMessageText(`Success upload to Telegraph\n${upload}`, { chat_id: chatId, message_id: load.message_id, disable_web_page_preview: true });
      return fs.unlinkSync(filePath);
   } catch (err) {
      await bot.editMessageText(`Failed to upload image to telegraph`, { chat_id: chatId, message_id: load.message_id });
      return bot.sendMessage(String(process.env.DEV_ID), `[ ERROR MESSAGE ]\n\n• Username: @${username}\n• File: funcs/images.js\n• Function: telegraphUpload()\n• filePath: ${filePath}\n\n${err}`.trim());
   }
}

async function Pomf2Upload(bot, chatId, filePath, username) {
   let load = await bot.sendMessage(chatId, `Loading, please wait`)
   try {
      let upload = await Pomf2Lain(filePath);
      await bot.editMessageText(`Success upload to pomf2.lain.la\n${upload.files[0].url}`, { chat_id: chatId, message_id: load.message_id, disable_web_page_preview: true });
      return fs.unlinkSync(filePath);
   } catch (err) {
      await bot.editMessageText(`Failed to upload image to pomf2.lain.la`, { chat_id: chatId, message_id: load.message_id, disable_web_page_preview: true });
      return bot.sendMessage(String(process.env.DEV_ID), `[ ERROR MESSAGE ]\n\n• Username: @${username}\n• File: funcs/images.js\n• Function: Pomf2Upload()\n• filePath: ${filePath}\n\n${err}`.trim());
   }
}

async function Ocr(bot, chatId, filePath, username) {
   let load = await bot.sendMessage(chatId, `Loading, please wait`)
   try {
      let upload = await TelegraPh(filePath);
      await bot.editMessageText(`Uploading image, please wait`, { chat_id: chatId, message_id: load.message_id });
      let ocrbejir = await ImageToText(upload);
      await bot.editMessageText(ocrbejir, { chat_id: chatId, message_id: load.message_id, disable_web_page_preview: true });
      return fs.unlinkSync(filePath);
   } catch (err) {
      await bot.editMessageText(`Failed to extract text in the image, make sure your image has text`, { chat_id: chatId, message_id: load.message_id, disable_web_page_preview: true });
      return bot.sendMessage(String(process.env.DEV_ID), `[ ERROR MESSAGE ]\n\n• Username: @${username}\n• File: funcs/images.js\n• Function: Ocr()\n• filePath: ${filePath}\n\n${err}`.trim());
   }
}

module.exports = {
   telegraphUpload,
   Pomf2Upload,
   Ocr
}