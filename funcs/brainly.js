require('dotenv').config();
const req = require("request-promise")

const _required = (variable) => {
  if (variable === "" || variable === undefined) {
    throw ("Param cant be blank");
  }
}

const clean = (data) => {
  let regex = /(<([^>]+)>)/ig;
  data = data.replace(/(<br?\s?\/>)/ig, ' \n');
  return data.replace(regex, '');
};

const format_graphql = `query SearchQuery($query: String!, $first: Int!, $after: ID) {\n	questionSearch(query: $query, first: $first, after: $after) {\n	edges {\n	  node {\ncontent\n		attachments{\nurl\n}\n		answers {\n			nodes {\ncontent\n				attachments{\nurl\n}\n}\n}\n}\n}\n}\n}\n`;

const Brainly = async (query, count = 10) => {
  // check value is null or not
  _required(count);
  _required(query);

  let service = {
    uri: 'https://brainly.co.id/graphql/id',
    json: true,
    strictSSL: false,
    headers: {
      'host': 'brainly.co.id',
      "content-type": "application/json; charset=utf-8",
      "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36"
    },
    body: {
      "operationName": "SearchQuery",
      "variables": {
        "query": query,
        "after": null,
        "first": count
      },
      "query": format_graphql
    }
  };

  return await req.post(service).then(response => {
    let question_list = response.data.questionSearch.edges;

    if (question_list.length) {
      let final_data = [];
      question_list.forEach(question => {
        let jawaban = [];
        let answers = question.node.answers.nodes;

        if (answers.length) {
          // dump answers
          answers.forEach(answer => {
            jawaban.push({
              text: clean(answer.content)
            });
          });
        }
        final_data.push({
          "pertanyaan": clean(question.node.content),
          "jawaban": jawaban,
        });
      });
      return {
        'success': true,
        'length': final_data.length,
        'message': 'Request Success',
        'data': final_data
      };
    } else {
      return {
        'success': false,
        'length': 0,
        'message': 'Data not found',
        'data': []
      };
    }
  });
};

async function getBrainlyAnswer(bot, chatId, input, userName) {
  if (!input) return bot.sendMessage(chatId, `Masukkan soal atau pertanyaan yang mau kamu cari di brainly, contoh\n/brainly berapa letak geografis indonesia`);
  try {
    bot.sendChatAction(chatId, 'typing');
    let getdata = await Brainly(input, 10);
    let results = ``;
    if (getdata.success) {
      const results = getdata.data.map(mil => {
        const jawabanArray = mil.jawaban.map(j => '• ' + j.text);
        const jawabanString = jawabanArray.join('\n');
        return `Pertanyaan: ${mil.pertanyaan.trim()}\nJawaban:\n${jawabanString.trim()}`;
      }).join('\n═════════════════════\n');

      const chunkSize = 2500;
      for (let i = 0; i < results.length; i += chunkSize) {
        const chunk = results.substring(i, i + chunkSize);
        await bot.sendMessage(chatId, chunk, {
          disable_web_page_preview: true
        });
      }
    } else if (!getdata.success) {
      return bot.sendMessage(chatId, 'Data not found');
    }
  } catch (err) {
    await bot.sendMessage(String(process.env.DEV_ID), `[ ERROR MESSAGE ]\n\n• Username: @${userName}\n• File: funcs/brainly.js\n• Function: getBrainlyAnswer()\n• Input: ${input}\n\n${err}`.trim());
    return bot.sendMessage(chatId, 'An error occurred!');
  }
}

module.exports = {
  getBrainlyAnswer
}