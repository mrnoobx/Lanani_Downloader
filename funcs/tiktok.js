require('dotenv').config()
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const util = require('util');
const { getBuffer, filterAlphanumericWithDash, getRandom } = require('./functions');

async function ttembed(inputurl) {
  let url = inputurl;
  if (inputurl.includes('vm.tiktok.com')) {
    let rep = inputurl.replace('vm.tiktok.com', 'www.tiktok.com/t');
    url = rep;
  } else if (inputurl.includes('vt.tiktok.com')) {
    let rep = inputurl.replace('vt.tiktok.com', 'www.tiktok.com/t');
    url = rep;
  }
  try {
    let uerl = 'https://www.tiktok.com/oembed?url='+url;
    let get = await axios.get(uerl, { headers: {
				"user-agent": "Mozilla/5.0 (Linux; U; Android 12; in; SM-A015F Build/SP1A.210812.016.A015FXXS5CWB2) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/110.0.0.0 Mobile Safari/537.36"
			}});
    let res = get.data;
    if (res.embed_type === 'music') {
      let results = {
        type: 'music',
        title: res.title
      };
      return results;
    } else if (res.embed_type === 'video') {
      let $ = cheerio.load(res.html);
      let results = {
        type: 'video',
        title: res.title,
        author: res.author_name,
        thumb: res.thumbnail_url,
        shorturl: `${res.author_unique_id}/video/${res.embed_product_id}`,
        soundtitle: $('a').last().attr('title'),
        sound: $('a').last().attr('href').replace('https://www.tiktok.com/music/', '')
      };
      return results;
    }
  } catch (err) {
    return { type: 'image' }
  }
}

function tiktokdl(URL) {
  return new Promise((resolve, rejecet) => {
    axios.get('https://musicaldown.com/id', {
      headers: {
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
      }
    }).then(res => {
      const $ = cheerio.load(res.data)
      const url_name = $("#link_url").attr("name")
      const token_name = $("#submit-form > div").find("div:nth-child(1) > input[type=hidden]:nth-child(2)").attr("name")
      const token_ = $("#submit-form > div").find("div:nth-child(1) > input[type=hidden]:nth-child(2)").attr("value")
      const verify = $("#submit-form > div").find("div:nth-child(1) > input[type=hidden]:nth-child(3)").attr("value")
      let data = {
        [`${url_name}`]: URL,
        [`${token_name}`]: token_,
        verify: verify
      }
      axios.request({
        url: 'https://musicaldown.com/id/download',
        method: 'post',
        data: new URLSearchParams(Object.entries(data)),
        headers: {
          'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36',
          'cookie': res.headers["set-cookie"]
        }
      }).then(respon => {
        const ch = cheerio.load(respon.data)
        axios.request({
          url: 'https://musicaldown.com/id/mp3',
          method: 'post',
          headers: {
            'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36',
            'cookie': res.headers["set-cookie"]
          }
        }).then(resaudio => {
          const hc = cheerio.load(resaudio.data)
          if (ch('.card-image')[0]) {
            let result = [];
            ch('.card-image').each((i, mil) => {
              let urlimg = ch(mil).find('img').attr('src');
              result.push({ image: urlimg })
            })
            resolve(result)
          } else if (ch('body > div.welcome.section > div > div > div.col.s12.l4 > audio > source').attr('src')) {
            const result = {
              type: 'music',
              title: ch('body > div.welcome.section > div.container > div > div.col.s12.l8 > h2.white-text').text().replace('Music Title: ', ''),
              audio: ch('body > div.welcome.section > div > div > div.col.s12.l4 > audio > source').attr('src'),
              audio2: ch('body > div.welcome.section > div.container > div > div.col.s12.l8 > a').attr('href')
            };
            resolve(result);
          } else {
            const result = {
              type: 'video',
              pp: ch('body > div.welcome.section > div > div > div.col.s12.l4.center-align > div > div > img').attr('src'),
              username: ch('body > div.welcome.section > div > div > div.col.s12.l4.center-align > div > h2 > b').text(),
              description: ch('body > div.welcome.section > div > div > div.col.s12.l4.center-align > div > h2 + h2').text(),
              video: ch('body > div.welcome.section > div.container > div > div.col.s12.l8 > a').attr('href'),
              audio: hc('body > div.welcome.section > div.container > div > div.col.s12.l8 > a + br + a').attr('href'),
              videohd: ch('body > div.welcome.section > div.container > div > div.col.s12.l8 > a + br + a + br + a').attr('href'),
              videowm: ch('body > div.welcome.section > div.container > div > div.col.s12.l8 > a + br + a + br + a + br + a').attr('href')
            }
            resolve(result);
          }
        })
      })
    })
  })
}


async function getTiktokInfo(bot, chatId, url, userName) {
  let load = await bot.sendMessage(chatId, `Loading, please wait.`);
  try {
    let getinfo = await ttembed(url);
    if (getinfo.type === 'music') {
      let getdl = await tiktokdl(url);
      await bot.editMessageText('Downloading tiktok music...!', { chat_id: chatId, message_id: load.message_id })
      let title = getinfo.title;
      let getbuff = await getBuffer(getdl.audio || getdl.audio2);
      await fs.writeFileSync(`content/${title}-${chatId}.mp3`, getbuff);
      await bot.sendChatAction(chatId, 'upload_voice');
      await bot.sendAudio(chatId, `content/${title}-${chatId}.mp3`, { caption: 'Downloaded audio: ' + title + ' by @Krxuvv', filename: `${title}-${chatId}.mp3`, contentType: 'audio/mp3' })
      await bot.deleteMessage(chatId, load.message_id);
      await fs.unlinkSync(`content/${title}-${chatId}.mp3`)
    } else if (getinfo.type === 'image') {
      let getdl = await tiktokdl(url);
      if (!getdl[0]) {
        return bot.editMessageText('Download failed, make sure your TikTok link is valid', { chat_id: chatId, message_id: load.message_id });
      }
      getdl.forEach(async maru => {
        let buff = await getBuffer(maru.image)
        await bot.sendChatAction(chatId, 'upload_photo')
        await bot.sendPhoto(chatId, buff)
      })
      await bot.deleteMessage(chatId, load.message_id);
    } else if (getinfo.type === 'video') {
      let options = {
        caption: `Tiktok Information\nUsername: ${getinfo.author ? getinfo.author : '-'}\nTitle: ${getinfo.title ? getinfo.title : '-'}\n\nPlease select the following options`,
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [{ text: 'Download Video', callback_data: 'ttv ' + getinfo.shorturl }],
            [{ text: 'Download Audio', callback_data: 'tta ' + getinfo.shorturl }],
            [{ text: 'Download Sound', callback_data: 'tts ' + getinfo.shorturl }]
          ]
        })
      };
      await fs.writeFileSync(`content/tt-thumb-${chatId}.jpg`, await getBuffer(getinfo.thumb));
      await bot.sendPhoto(chatId, `content/tt-thumb-${chatId}.jpg`, options)
      await bot.deleteMessage(chatId, load.message_id)
    } else {
      return bot.editMessageText('An error occurs, make sure your tiktok link is valid and not private!', { chat_id: chatId, message_id: load.message_id })
    }
  } catch (err) {
    await bot.sendMessage(String(process.env.DEV_ID), `[ ERROR MESSAGE ]\n\n• Username: @${userName}\n• File: funcs/tiktok.js\n• Function: getTiktokInfo()\n• Url: ${url}\n\n${err}`.trim());
    return bot.editMessageText('An error occurs, make sure your tiktok link is valid and not private!', { chat_id: chatId, message_id: load.message_id })
  }
}

async function tiktokVideo(bot, chatId, url, userName) {
  load = await bot.sendMessage(chatId, 'Downloading video...');
  try {
    let get = await tiktokdl('https://www.tiktok.com/@' + url);
    let fname = `tiktok_video_${get.username}-${chatId}.mp4`;
    let getbuff = await getBuffer(get.video);
    await fs.writeFileSync(`content/${fname}`, getbuff);
    await bot.sendChatAction(chatId, 'upload_video')
    await bot.sendVideo(chatId, `content/${fname}`, { filename: fname, contentType: 'video/mp4', caption: `Bot by @Krxuvv` });
    await bot.deleteMessage(chatId, load.message_id);
    await fs.unlinkSync('content/'+fname)
  } catch (err) {
    await bot.sendMessage(String(process.env.DEV_ID), `[ ERROR MESSAGE ]\n\n• Username: @${userName}\n• File: funcs/tiktok.js\n• Function: tiktokVideo()\n• Url: ${url}\n\n${err}`.trim());
    return bot.editMessageText('An error occurred!', { chat_id: chatId, message_id: load.message_id })
  }
}

async function tiktokAudio(bot, chatId, url, userName) {
  load = await bot.sendMessage(chatId, 'Downloading audio...');
  try {
    let get = await tiktokdl('https://www.tiktok.com/@' + url);
    let fname = `tiktok_audio_${get.username}-${chatId}.mp3`;
    let getbuff = await getBuffer(get.audio || get.audio2);
    await fs.writeFileSync(`content/${fname}`, getbuff);
    await bot.sendChatAction(chatId, 'upload_voice');
    await bot.sendAudio(chatId, `content/${fname}`, { filename: fname, contentType: 'audio/mp3', caption: `Bot by @Krxuvv` });
    await bot.deleteMessage(chatId, load.message_id);
    await fs.unlinkSync('content/'+fname)
  } catch (err) {
    await bot.sendMessage(String(process.env.DEV_ID), `[ ERROR MESSAGE ]\n\n• Username: @${userName}\n• File: funcs/tiktok.js\n• Function: tiktokAudio()\n• Url: ${url}\n\n${err}`.trim());
    return bot.editMessageText('An error occurred!', { chat_id: chatId, message_id: load.message_id })
  }
}

async function tiktokSound(bot, chatId, url, userName) {
  load = await bot.sendMessage(chatId, 'Downloading audio...');
  try {
    let get2 = await ttembed('https://www.tiktok.com/@' + url)
    let get = await tiktokdl('https://www.tiktok.com/music/' + get2.sound)
    let fname = `${filterAlphanumericWithDash(get2.soundtitle)}-${chatId}.mp3`;
    let getbuff = await getBuffer(get.audio || get.audio2);
    await fs.writeFileSync(`content/${fname}`, getbuff);
    await bot.sendChatAction(chatId, 'upload_voice');
    await bot.sendAudio(chatId, `content/${fname}`, { filename: fname, contentType: 'audio/mp3', caption: `Bot by @Krxuvv` });
    await bot.deleteMessage(chatId, load.message_id);
    await fs.unlinkSync('content/'+fname)
  } catch (err) {
    await bot.sendMessage(String(process.env.DEV_ID), `[ ERROR MESSAGE ]\n\n• Username: @${userName}\n• File: funcs/tiktok.js\n• Function: tiktokSound()\n• Url: ${url}\n\n${err}`.trim());
    return bot.editMessageText('An error occurred!', { chat_id: chatId, message_id: load.message_id })
  }
}

module.exports = {
  getTiktokInfo,
  tiktokVideo,
  tiktokAudio,
  tiktokSound
}