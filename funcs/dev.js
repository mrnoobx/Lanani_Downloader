const NetworkSpeed = require('network-speed')
const testNetworkSpeed = new NetworkSpeed()
const { exec } = require('child_process')
const util = require('util')

async function getNetworkDownloadSpeed(bot, chatId) {
	console.log('Calculating Download Speed...')
	bot.sendMessage(chatId, 'Calculating Download Speed...').catch((err) => {
		console.log(err)
	})
	const baseUrl = 'https://eu.httpbin.org/stream-bytes/100000'
	const fileSizeInBytes = 100000
	const speed = await testNetworkSpeed.checkDownloadSpeed(
		baseUrl,
		fileSizeInBytes
	)
	bot.sendMessage(chatId, `Download Speed: ${speed.mbps} Mbps`).catch(
		(err) => {
			console.log(err)
		}
	)
	console.log(`Download Speed: ${speed.mbps} Mbps`)
}

async function getNetworkUploadSpeed(bot, chatId) {
	console.log('Calculating Upload Speed...')
	bot.sendMessage(chatId, 'Calculating Upload Speed...').catch((err) => {
		console.log(err)
	})
	const options = {
		hostname: 'www.google.com',
		port: 80,
		path: '/catchers/544b09b4599c1d0200000289',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
	}
	const fileSizeInBytes = 2000000
	const speed = await testNetworkSpeed.checkUploadSpeed(
		options,
		fileSizeInBytes
	)
	bot.sendMessage(chatId, `Upload Speed: ${speed.mbps} Mbps`).catch((err) => {
		console.log(err)
	})
	console.log(`Upload Speed: ${speed.mbps} Mbps`)
}

async function evaluateBot(bot, chatId, input) {
   if (!input) return bot.sendMessage(chatId, `What do you want to do?`)
   let evalCmd = ""
   try {
      evalCmd = /await/i.test(input) ? eval("(async() => { " + input + " })()") : eval(input)
   } catch (e) {
      evalCmd = e
   }
   new Promise(async (resolve, reject) => {
      try {
         resolve(evalCmd);
      } catch (err) {
         reject(err)
      }
   })
   ?.then((res) => bot.sendMessage(chatId, util.format(res), { parse_mode: 'Markdown' }))
   ?.catch((err) => bot.sendMessage(chatId, `Error: ${err}`, { parse_mode: 'Markdown' }))
}

async function executeBot(bot, chatId, input) {
   if (!input) return bot.sendMessage(chatId, `What do you want to do?`)
   try {
      exec(input, async (err, stdout) => {
         if (err) await bot.sendMessage(chatId, `Error: ${err}`)
         if (stdout) await bot.sendMessage(chatId, util.format(stdout))
      })
   } catch (e) {
      return bot.sendMessage(chatId, `Error: ${e}`)
   }
}

module.exports = {
	getNetworkDownloadSpeed,
	getNetworkUploadSpeed,
	evaluateBot,
	executeBot
}
