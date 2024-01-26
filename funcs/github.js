require('dotenv').config();
let fs = require('fs')
let { getBuffer } = require('./functions');
let regex = /(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/(.+)/i

async function gitClone(bot, chatId, link, username) {
   let load = await bot.sendMessage(chatId, `Loading, please wait`);
   let [_, user, repo] = (link || '').match(regex) || []
   repo = repo.replace(/.git$/, '')
   let url = `https://api.github.com/repos/${user}/${repo}/zipball`
   let getbuff = await getBuffer(url);
   let filename = (await fetch(url, { method: 'HEAD' })).headers.get('content-disposition').match(/attachment; filename=(.*)/)[1];
   await fs.writeFileSync(`content/${filename}`, getbuff);
   try {
   	await bot.sendDocument(chatId, `content/${filename}`, { caption: `Success Download Github\nRepo: ${link}`, disable_web_page_preview: true })
   	await fs.unlinkSync(`content/${filename}`);
   	return bot.deleteMessage(chatId, load.message_id)
	} catch (err) {
	   await bot.sendMessage(String(process.env.DEV_ID), `[ ERROR MESSAGE ]\n\n• Username: @${username}\n• File: funcs/github.js\n• Function: gitClone()\n• Url: ${link}\n\n${err}`.trim(), { disable_web_page_preview: true });
	   return bot.editMessageText(`Failed to download file\nPlease download it yourself in your browser using the following link\n${url}`, { chat_id: chatId, message_id: load.message_id, disable_web_page_preview: true })
	}
}

module.exports = {
   gitClone
}