require('dotenv').config()
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const { getBuffer, filterAlphanumericWithDash } = require('./functions');
const { readDb, writeDb, addUserDb, changeBoolDb } = require('./database');
const util = require('util');

async function fbdown(link) {
    try {
        const config = { 'url': link };
        const response = await axios.post('https://www.getfvid.com/downloader', new URLSearchParams(Object.entries(config)), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
                'X-XSRF-TOKEN': 'eyJpdiI6IkVNbUtrYm5UVlNBXC96cExtaXBCcDl3PT0iLCJ2YWx1ZSI6ImM4cG9XMWk1ZDNkcyt6VjJKd3pvZitOd1lJU1JMMHNFRlwvYXB2b2VJYnB5OTRCQmRHRWI4akZ0SWVPVzJ6NEZUVnNFckZ6R0Z6TDNackRLenJhWlVaUT09',
                'Cookie': 'XSRF-TOKEN=eyJpdiI6IkVNbUtrYm5UVlNBXC96cExtaXBCcDl3PT0iLCJ2YWx1ZSI6ImM4cG9XMWk1ZDNkcyt6VjJKd3pvZitOd1lJU1JMMHNFRlwvYXB2b2VJYnB5OTRCQmRHRWI4akZ0SWVPVzJ6NEZUVnNFckZ6R0Z6TDNackRLenJhWlVaUT09',
            },
        });

        const $ = cheerio.load(response.data);
        return {
            Normal_video: $('body > div.page-content > div > div > div.col-lg-10.col-md-10.col-centered > div > div:nth-child(3) > div > div.col-md-4.btns-download > p:nth-child(1) > a').attr('href'),
            HD: $('body > div.page-content > div > div > div.col-lg-10.col-md-10.col-centered > div > div:nth-child(3) > div > div.col-md-4.btns-download > p:nth-child(1) > a').attr('href'),
            audio: $('body > div.page-content > div > div > div.col-lg-10.col-md-10.col-centered > div > div:nth-child(3) > div > div.col-md-4.btns-download > p:nth-child(2) > a').attr('href'),
            thumb: $('.img-video').css('background-image').slice(4, -1).replace(/"/g, ''),
        };
    } catch (err) {
        return { status: false };
    }
}

const getFBInfo = (videoUrl, cookie, useragent) => {
  const headers = {
    "sec-fetch-user": "?1",
    "sec-ch-ua-mobile": "?0",
    "sec-fetch-site": "none",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "cache-control": "max-age=0",
    authority: "www.facebook.com",
    "upgrade-insecure-requests": "1",
    "accept-language": "en-GB,en;q=0.9,tr-TR;q=0.8,tr;q=0.7,en-US;q=0.6",
    "sec-ch-ua": '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
    "user-agent":
      useragent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    cookie:
      cookie || "sb=Rn8BYQvCEb2fpMQZjsd6L382; datr=Rn8BYbyhXgw9RlOvmsosmVNT; c_user=100003164630629; _fbp=fb.1.1629876126997.444699739; wd=1920x939; spin=r.1004812505_b.trunk_t.1638730393_s.1_v.2_; xs=28%3A8ROnP0aeVF8XcQ%3A2%3A1627488145%3A-1%3A4916%3A%3AAcWIuSjPy2mlTPuZAeA2wWzHzEDuumXI89jH8a_QIV8; fr=0jQw7hcrFdas2ZeyT.AWVpRNl_4noCEs_hb8kaZahs-jA.BhrQqa.3E.AAA.0.0.BhrQqa.AWUu879ZtCw",
  };

  const parseString = (string) => JSON.parse(`{"text": "${string}"}`).text;

  return new Promise((resolve, reject) => {
    if (!videoUrl || !videoUrl.trim()) return reject("Please specify the Facebook URL");

    if (
      ["facebook.com", "fb.watch"].every((domain) => !videoUrl.includes(domain))
    ) return reject("Please enter the valid Facebook URL");

    axios.get(videoUrl, { headers }).then(({ data }) => {
      data = data.replace(/&quot;/g, '"').replace(/&amp;/g, "&");

      const sdMatch = data.match(/"browser_native_sd_url":"(.*?)"/) || data.match(/"playable_url":"(.*?)"/) || data.match(/sd_src\s*:\s*"([^"]*)"/) || data.match(/(?<="src":")[^"]*(https:\/\/[^"]*)/);
      const hdMatch = data.match(/"browser_native_hd_url":"(.*?)"/) || data.match(/"playable_url_quality_hd":"(.*?)"/) || data.match(/hd_src\s*:\s*"([^"]*)"/);
      const titleMatch = data.match(/<meta\sname="description"\scontent="(.*?)"/);
      const thumbMatch = data.match(/"preferred_thumbnail":{"image":{"uri":"(.*?)"/);
			
			// @TODO: Extract audio URL

      if (sdMatch && sdMatch[1]) {
        const result = {
          url: videoUrl,
          sd: parseString(sdMatch[1]),
          hd: hdMatch && hdMatch[1] ? parseString(hdMatch[1]) : "",
          title: titleMatch && titleMatch[1] ? parseString(titleMatch[1]) : data.match(/<title>(.*?)<\/title>/)?.[1] ?? "",
          thumbnail: thumbMatch && thumbMatch[1] ? parseString(thumbMatch[1]) : "",
        };

        resolve(result);
      } else reject("Unable to fetch video information at this time. Please try again");
    }).catch(_ => reject("Unable to fetch video information at this time. Please try again"));
  });
};


async function getFacebook(bot, chatId, url, userName) {
  let load = await bot.sendMessage(chatId, 'Loading, please wait.');
  try {
    let get = await fbdown(url);
    if (!get.status) {
      await bot.editMessageText('Downloading video, please wait!', { chat_id: chatId, message_id: load.message_id });
      let get2 = await getFBInfo(url);
      await bot.sendVideo(chatId, get2.hd ? get2.hd : get2.sd, { caption: `Bot by @Krxuvv` })
      return bot.deleteMessage(chatId, load.message_id);
    }
    let data = get.HD ? [[{ text: 'Download Normal Video', callback_data: 'fbn ' + chatId }], [{ text: 'Download HD Video', callback_data: 'fbh ' + chatId }], [{ text: 'Download Audio Only', callback_data: 'fba ' + chatId, }]] : [[{ text: 'Download Normal Video', callback_data: 'fbn ' + chatId }], [{ text: 'Download Audio Only', callback_data: 'fba ' + chatId, }]];
    let db = await readDb('./database.json');
    db[chatId] = {
      fbnormal: get.Normal_video,
      fbhd: get.HD ? get.HD : '',
      fbmp3: get.audio
    };
    await writeDb(db, './database.json');
    let options = {
      caption: 'Please select the following options!',
      reply_markup: JSON.stringify({
        inline_keyboard: data
      })
    };
    await bot.sendPhoto(chatId, get.thumb ? get.thumb : 'https://telegra.ph/file/35683519e0893130739da.jpg', options);
    await bot.deleteMessage(chatId, load.message_id);
  } catch (err) {
    await bot.sendMessage(String(process.env.DEV_ID), `[ ERROR MESSAGE ]\n\n• Username: @${userName}\n• File: funcs/facebook.js\n• Function: getFacebook()\n• Url: ${url}\n\n${err}`.trim());
    await bot.editMessageText('An error occurred, failed to download the video!', { chat_id: chatId, message_id: load.message_id });
  }
}

async function getFacebookNormal(bot, chatId, userName) {
  let load = await bot.sendMessage(chatId, 'Loading, please wait.');
  let db = await readDb('./database.json');
  try {
    await bot.sendVideo(chatId, db[chatId].fbnormal, { caption: `Bot by @Krxuvv` });
    await bot.deleteMessage(chatId, load.message_id);
    db[chatId] = {
      fbnormal: '',
      fbhd: '',
      fbmp3: ''
    };
    await writeDb(db, './database.json');
  } catch (err) {
    await bot.sendMessage(String(process.env.DEV_ID), `[ ERROR MESSAGE ]\n\n• Username: @${userName}\n• File: funcs/facebook.js\n• Function: getFacebookNormal()\n\n${err}`.trim());
    await bot.editMessageText('Failed to download the video!\n\nPlease download it yourself in your browser\n' + db[chatId].fbnormal, { chat_id: chatId, message_id: load.message_id, disable_web_page_preview: true });
    db[chatId] = {
      fbnormal: '',
      fbhd: '',
      fbmp3: ''
    };
    await writeDb(db, './database.json');
  }
}

async function getFacebookHD(bot, chatId, userName) {
  let load = await bot.sendMessage(chatId, 'Loading, please wait.');
  let db = await readDb('./database.json');
  try {
    await bot.sendVideo(chatId, db[chatId].fbhd, { caption: `Bot by @Krxuvv` });
    await bot.deleteMessage(chatId, load.message_id);
    db[chatId] = {
      fbnormal: '',
      fbhd: '',
      fbmp3: ''
    };
    await writeDb(db, './database.json');
  } catch (err) {
    await bot.sendMessage(String(process.env.DEV_ID), `[ ERROR MESSAGE ]\n\n• Username: @${userName}\n• File: funcs/facebook.js\n• Function: getFacebookNormal()\n\n${err}`.trim());
    await bot.editMessageText('Failed to download the video!\n\nPlease download it yourself in your browser\n' + db[chatId].fbhd, { chat_id: chatId, message_id: load.message_id, disable_web_page_preview: true });
    db[chatId] = {
      fbnormal: '',
      fbhd: '',
      fbmp3: ''
    };
    await writeDb(db, './database.json');
  }
}

async function getFacebookAudio(bot, chatId, userName) {
  let load = await bot.sendMessage(chatId, 'Loading, please wait.');
  let db = await readDb('./database.json');
  try {
    let buff = await getBuffer(db[chatId].fbmp3)
    await fs.writeFileSync('content/Facebook_audio_' + chatId + '.mp3', buff);
    await bot.sendAudio(chatId, 'content/Facebook_audio_' + chatId + '.mp3', { caption: `Bot by @Krxuvv` });
    await bot.deleteMessage(chatId, load.message_id);
    db[chatId] = {
      fbnormal: '',
      fbhd: '',
      fbmp3: ''
    };
    await writeDb(db, './database.json');
  } catch (err) {
    await bot.sendMessage(String(process.env.DEV_ID), `[ ERROR MESSAGE ]\n\n• Username: @${userName}\n• File: funcs/facebook.js\n• Function: getFacebookAudio()\n\n${err}`.trim());
    await bot.editMessageText('Failed to send the audio!\n\nPlease download it yourself in your browser\n' + db[chatId].fbmp3, { chat_id: chatId, message_id: load.message_id, disable_web_page_preview: true });
    db[chatId] = {
      fbnormal: '',
      fbhd: '',
      fbmp3: ''
    };
    await writeDb(db, './database.json');
  }
}

module.exports = {
  getFacebook,
  getFacebookNormal,
  getFacebookHD,
  getFacebookAudio
}