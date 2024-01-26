const formData = require('form-data');
const axios = require('axios');
const fs = require('fs');
let Tesseract = require("tesseract.js")

/*
   TelegraPh("./image.jpg") // File
*/
async function TelegraPh(Path) {
	return new Promise (async (resolve, reject) => {
		if (!fs.existsSync(Path)) return reject(new Error("File not Found"))
		try {
			const form = new formData();
			form.append("file", fs.createReadStream(Path))
			const data = await  axios({
				url: "https://telegra.ph/upload",
				method: "POST",
				headers: {
					...form.getHeaders()
				},
				data: form
			})
			return resolve("https://telegra.ph" + data.data[0].src)
		} catch (err) {
			return reject(new Error(String(err)))
		}
	})
}

/*
   Pomf2Lain("./image.jpg") // File
*/
async function Pomf2Lain(fileName) {
  const fileData = fs.readFileSync(fileName)
  try {
    const form = new formData()
    form.append("files[]", fileData, `${Date.now()}.jpg`)
    const { data } = await axios(`https://pomf2.lain.la/upload.php`, {
      method: "post",
      data: form
    })
    return data
  } catch (err) {
    console.log(err)
    return String(err)
  } finally {
  }
}

/*
   ImageToText("https://telegra.ph/file/b848abd02be38defef44b.jpg") // Buffer Url
*/
async function ImageToText(url) {
   try {
      let ocr = await (await Tesseract.recognize(url, 'eng')).data.text;
      return ocr
   } catch (err) {
      return err
   }
}

/*
   EnhanceImage("https://telegra.ph/file/b848abd02be38defef44b.jpg") // Buffer Url
*/
async function EnhanceImage(url, scale) {
  const scaleNumber = scale ? scale : 2
  const { data } = await axios(`https://toolsapi.spyne.ai/api/forward`, {
    method: "post",
    data: {
      image_url: url,
      scale: scaleNumber,
      save_params: {
        extension: ".png",
        quality: 100
      }
    },
    headers: {
      "content-type": "application/json",
      accept: "*/*"
    }
  })
  return data
}

module.exports = {
   TelegraPh,
   Pomf2Lain,
   ImageToText,
   EnhanceImage
}