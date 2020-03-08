const ADODB = require('node-adodb');
const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=.\\data\\loilang.mdb;Jet OLEDB:Database Password=luiziuim');

process();

class PEG {
  word = "";
  pys = []; // py for each single character
  def = "";
}

class Word {
  word = "";
  pys = [];
  mpys = [];
  def = "";
  egs = "";
  pegs = [];
  cmts = [];
}

const CN_CHAR_REG = /[\u4e00-\u9fa5]/;
const IDX = ['①', '②', '③', '④', '⑤', '⑥',];
const IDX_REG = /[①②③④⑤⑥]/

async function process() {
  const words = await connection.query('SELECT DISTINCT 字形 FROM 表1');
  console.log(`read ${words.length} word`);

  const docs = [];

  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    const defines = await connection.query(`SELECT * FROM 表1 WHERE 字形=${word}`);

    const newWord = new Word();

    const pinyins = defines.map(define => define['拼音']);
    const define = defines[0]['音义辨析'];
    const examples = define['例'];
    const refer = define['《康熙字典》等典籍摘录'];
    const oldPinyin = define['《广韵》字音'];

    // try {
    //   if (define.contains(IDX[0])) {
    //     // 有多组读音
    //     const DEFINE_PINYIN_REG = /[①②③④⑤⑥](\[[\w\d]+\])+/g;
    //     const mappedPinyins = define.match(DEFINE_PINYIN_REG)
    //       .map(py => py.slice(1).match(/\[[\w\d]+\]/).map(py => py.replace(/[\[\]]/g, '')));

    //     newWord.mpys = mappedPinyins;
    //   } else {
    //     // 只有一组读音
    //     const DEFINE_PINYIN_REG = /(\[[\w\d]+\])+/g;
    //     const mappedPinyins = define.match(DEFINE_PINYIN_REG).map(py => py.replace(/[\[\]]/g, '')));
    //     newWord.mpys = [mappedPinyins];
    //   }
    // } catch (error) {
    //   console.log(`cant parse pinyin for ${word}`);
    // }

    if (!!examples && examples.contains('【')) {
      // 有例词
      try {
        if (examples.contains(IDX[0])) {
          // 例子对应多组读音
          const exampleGroups = examples.split(/(?=[①②③④⑤⑥])/).filter(e => !!e);
          for (let gi = 0; gi < exampleGroups.length; gi += 1) {
            const group = exampleGroups[gi].replace(/[①②③④⑤⑥]：?/, '');
            const groupPinyinIndex = IDX.indexOf(exampleGroups[gi][0]);

            const groupExampleList = group
              .split(/#+/)
              .filter(e => !!e).map(example => {
                const [exampleWord, exampleDefine] = example.slice('【'.length).split('】');
                const cnPinyinReg = /[\u4e00-\u9fa5](\[[\w\d]+\])?/g;
                const splitedWord = exampleWord.match(cnPinyinReg);
                const ogExampleWord = splitedWord.map(w => w.match(/[\u4e00-\u9fa5]/)[0]);
                // const ogExampleWordPinyin = [];
                // for (let wi = 0; wi < splitedWord.length; wi += 1) {
                //   const pyForWordWi = splitedWord[wi].match(/\[[\w\d]+\]/);
                //   if (!!pyForWordWi) {
                //     ogExampleWordPinyin[wi] = pyForWordWi;
                //   } else {
                //     if (!!newWord.mpys) {
                //       if (wi === 0) {
                //         if (ogExampleWord[wi] === word) {
                //           ogExampleWordPinyin[wi] = newWord.mpys[gi];
                //         }
                //       }
                //     }
                //   }
                // }
              });

          }
        } else {
          // 例子只有一组读音

        }
      } catch (error) {
        console.log(`cant parse examples for ${word}`);
      }
    } else {
      // 没有例子
      console.log(`examples for ${word} is not in format`);
    }
  }
}