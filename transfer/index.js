const ADODB = require('node-adodb');
const connection = ADODB.open(
  "Provider=Microsoft.Jet.OLEDB.4.0;Data Source='E:\\Projects\\loi-script\\transfer\\data\\loilang.mdb';Jet OLEDB:Database Password=luiziuim"
);
const fs = require('fs');

process();

// class PEG {
//   word = "";
//   pys = []; // py for each single character
//   def = "";
// }

// class DEF {
//   word = "";
//   rawId = "";
//   numId = "";
//   py = "";
//   mean = "";
// }

// class Word {
//   word = "";
//   alias = "";
//   def = [];
//   egs = "";
//   pegs = [];
//   cmts = [];
// }

const CN_CHAR_REG = /[\u4e00-\u9fa5]/;
const IDX = ['①', '②', '③', '④', '⑤', '⑥',];
const IDX_REG = /[①②③④⑤⑥]/

const MULTI_SPELL_REG = /^[\u4e00-\u9fa5](\/[\u4e00-\u9fa5])+/;
const DEF_REG = /^((?:[\u4e00-\u9fa5](?:\/[\u4e00-\u9fa5])*)?)([①②③④⑤⑥]?)((?:\[(?:[\w（）\u4e00-\u9fa5，])+\])+)(.*)/;
const EXAMPLE_REG = /^([\/\u4e00-\u9fa5]*[①②③④⑤⑥]*[:：\s]*)(.*)/;

async function process() {
  const words = await connection.query('SELECT DISTINCT 字形 FROM 表1');
  console.log(`read ${words.length} word`);

  const docs = [];

  for (let i = 1000; i < 1100; i += 1) {
    const curWord = words[i]['字形'];

    console.log(`cur process: ${curWord}`);

    const defines = await connection.query(`SELECT * FROM 表1 WHERE 字形='${curWord}'`);
    const newWord = {};

    const define = defines[0]['音义辨析'];
    const example = define['例'];
    const refer = define['《康熙字典》等典籍摘录'];
    const oldPinyin = define['《广韵》字音'];

    try {

      const defines = define.split('##');
      const defineAlias = defines[0];
      const mappedSubDefines = defines.slice(1).map(subDefine => {
        const _def = {};

        const regResult = subDefine.match(DEF_REG);
        _def.t = regResult[1] ? regResult[1] : defineAlias;
        _def.rid = `${_def.t}${regResult[2]}`; // 原始拼音標題
        _def.pid = `${_def.t[0]}${regResult[2]}`; // 處理後拼音標題

        const numberIdx = regResult[2] ? IDX.indexOf(regResult[2]) : 0;
        _def.nid = numberIdx; // 拼音標號，0起
        _def.py = regResult[3];
        _def.def = regResult[4].trim();

        return _def;
      })
      newWord.w = curWord;
      newWord.pys = mappedSubDefines;

      docs.push(newWord);
    } catch (error) {
      console.error(`failed to parse defines for ${curWord}`);
      console.error(error);
    }

    // try {
    //   const examples = example.split('##');
    //   const mappedExamples = examples.map(subExample => {
    //     const splitedExample = subExample.match(EXAMPLE_REG);
    //     const _exampleTitle = splitedExample[1] ? splitedExample[1].replace(/[:：\s]+/, '') : '';
    //     const _exampleContents = splitedExample[2].split('#').map(_exampleContent => {

    //     });
    //   })
    // } catch (error) {
    //   console.error(`failed to parse examples for ${curWord}`);
    //   console.error(error);
    // }
  }

  fs.writeFileSync('output.json', JSON.stringify(docs));
}