const ADODB = require('node-adodb');
const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=.\\data\\loilang.mdb;Jet OLEDB:Database Password=luiziuim');

process();

class PEG {
  word = "";
  pys = []; // py for each single character
  def = "";
}

class DEF {
  word = "";
  rawId = "";
  numId = "";
  py = "";
  mean = "";
}

class Word {
  word = "";
  alias = "";
  def = [];
  egs = "";
  pegs = [];
  cmts = [];
}

const CN_CHAR_REG = /[\u4e00-\u9fa5]/;
const IDX = ['①', '②', '③', '④', '⑤', '⑥',];
const IDX_REG = /[①②③④⑤⑥]/

const MULTI_SPELL_REG = /^[\u4e00-\u9fa5](\/[\u4e00-\u9fa5])+/;
const DEF_REG = /^((?:[\u4e00-\u9fa5](?:\/[\u4e00-\u9fa5])*){0,1})([①②③④⑤⑥]{0,1})((?:\[[\w\W]+\])+)(.*)/;

async function process() {
  const words = await connection.query('SELECT DISTINCT 字形 FROM 表1');
  console.log(`read ${words.length} word`);

  const docs = [];

  for (let i = 0; i < words.length; i += 1) {
    const curWord = words[i];
    const defines = await connection.query(`SELECT * FROM 表1 WHERE 字形=${curWord}`);

    const newWord = new Word();

    const define = defines[0]['音义辨析'];
    const examples = define['例'];
    const refer = define['《康熙字典》等典籍摘录'];
    const oldPinyin = define['《广韵》字音'];

    const pinyins = [];
   
    const defines = define.split('##');
    const defineAlias = defines[0];
    const mappedSubDefines = defines.slice(1).map(subDefine => {
      const _def = new DEF();

      const regResult = subDefine.match(DEF_REG);
      _def.word = regResult[1] ? regResult[1] : defineAlias;
      _def.rawId = `${regResult[1]}${regResult[2]}`;
      const numberIdx = regResult[2] ? IDX.indexOf(regResult[2]) : 0;
      _def.numId = `${regResult[1]}${numberIdx}`;
      _def.py = regResult[3];
      _def.mean = regResult[4];

      return _def;
    })
  }
}