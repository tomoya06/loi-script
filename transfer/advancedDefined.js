const ADODB = require('node-adodb');
const connection = ADODB.open(
  "Provider=Microsoft.Jet.OLEDB.4.0;Data Source='E:\\Projects\\loi-script\\transfer\\data\\loilang.mdb';Jet OLEDB:Database Password=luiziuim"
);
const fs = require('fs');

process();

const CN_CHAR_REG = /[\u4e00-\u9fa5]/;
const IDX = ['①', '②', '③', '④', '⑤', '⑥',];
const IDX_REG = /[①②③④⑤⑥]/

const MULTI_SPELL_REG = /^[\u4e00-\u9fa5](\/[\u4e00-\u9fa5])+/;

async function process() {
  // const words = await connection.query('SELECT DISTINCT 字形 FROM 表1');
  const words = ['落',
    '乌',
    '现',
    '呀',
    '曾',
    '徵',
    '證',
    '钻',
  ];
  console.log(`read ${words.length} word`);

  const docs = [];

  for (let i = 0; i < words.length; i += 1) {
    const curWord = words[i];
    const defines = await connection.query(`SELECT * FROM 表1 WHERE 字形='${curWord}'`);

    console.log(`cur process: ${curWord}`);

    const newWord = {};

    const define = defines[0]['音义辨析'];
    const example = defines[0]['例'];
    const refer = defines[0]['《康熙字典》等典籍摘录'];
    const oldPinyin = defines[0]['《广韵》字音'];

    try {
      const defines = define.split('##');
      const defineAlias = defines[0];
      const mappedSubDefines = defines.slice(1).map(subDefine => {
        const _def = {};

        if (subDefine.startsWith('注：')) {
          _def.t = subDefine.slice(0, '注：'.length);
          _def.def = subDefine.slice('注：'.length);
        } else {
          const DEF_REG = /^((?:[\u4e00-\u9fa5](?:\/[\u4e00-\u9fa5])*)?)([①②③④⑤⑥]?)((?:\[(?:[\w（）\u4e00-\u9fa5，])+\])+)(.*)/;
          const regResult = subDefine.match(DEF_REG);
          _def.t = regResult[1] ? regResult[1].replace(/[：]/, '') : defineAlias;
          _def.rid = `${regResult[1]}${regResult[2]}`; // 原始拼音標題
          _def.pid = `${_def.t[0]}${regResult[2]}`; // 處理後拼音標題
  
          const numberIdx = regResult[2] ? IDX.indexOf(regResult[2]) : 0;
          _def.nid = numberIdx; // 拼音標號，0起
          _def.py = regResult[3];
          _def.def = regResult[4].trim();
        }


        return _def;
      })
      newWord.w = curWord;
      newWord.pys = mappedSubDefines;

      docs.push(newWord);
    } catch (error) {
      console.error(`failed to parse defines for ${curWord}`);
      console.error(error);
    }

    try {
      if (example) {
        const examples = example.split('##');
        const mappedExamples = examples.map(subExample => {
          const EXAMPLE_REG = /^([\/\u4e00-\u9fa5]*[①②③④⑤⑥]*[:：\s]*)(.*)/;
          const splitedExample = subExample.match(EXAMPLE_REG);
          const _exampleTitle = splitedExample[1] ? splitedExample[1].replace(/[:：\s]/, '') : '';
          const _exampleContents = splitedExample[2].split('#').map(_exampleContent => {
            // 这里能拿到一个单词+拼音+解释了
            const EXAMPLE_CONTENT_REG = /(【[\w\W]+】)(.*)/;
            const mappedExampleContent = _exampleContent.match(EXAMPLE_CONTENT_REG);
            const _exampleContentWord = mappedExampleContent[1];
            const _exampleContentDef = mappedExampleContent[2];

            const WORD_PINYIN_REG = /[\u4e00-\u9fa5，。～](\[\w+\]\/?)*/g;
            const singleWords = _exampleContentWord.match(WORD_PINYIN_REG);
            const jointWords = singleWords.map(w => w[0]).join('');
            const wordPinyins = singleWords.map(w => w.slice(1));

            let _wordPinyinUpdates = "";
            for (let wi = 0; wi < singleWords.length; wi += 1) {
              if (wordPinyins[wi] || /[^\u4e00-\u9fa5]/.test(jointWords[wi])) {
                continue;
              }
              // 是不是叠音字
              const prevIndex = jointWords.slice(0, wi).indexOf(jointWords[wi]);
              if (prevIndex >= 0) {
                wordPinyins[wi] = wordPinyins[prevIndex];
                _wordPinyinUpdates += `${wi} -> ${wordPinyins[wi]}(dup)`;
                continue;
              }
              // 是当前的字
              if (jointWords[wi] === curWord) {
                if (!_exampleTitle) {
                  wordPinyins[wi] = newWord.pys[0].py;
                  _wordPinyinUpdates += `${wi} -> ${wordPinyins[wi]}(cur0)`;
                  continue;
                }
                try {
                  wordPinyins[wi] = newWord.pys
                    .find(py => py.rid === _exampleTitle || py.pid === _exampleTitle)
                    .py;
                  _wordPinyinUpdates += `${wi} -> ${wordPinyins[wi]}(cur-find)`;
                } catch (error) {
                  console.error(`failed to find pinyin for ${curWord} - ${jointWords}`);
                  console.error(error);
                }
              }
            }
            if (_wordPinyinUpdates) {
              console.log(`parse pinyin for ${curWord} - ${jointWords}: ${_wordPinyinUpdates}`);
            }

            return {
              w: jointWords,
              pys: [wordPinyins],
              def: _exampleContentDef,
            }
          });
          return {
            t: _exampleTitle,
            egs: _exampleContents,
          }
        });
        newWord.eg = mappedExamples;
      }
    } catch (error) {
      console.error(`failed to parse examples for ${curWord}`);
      console.error(error);
    }

    newWord.add = {}

    try {
      if (refer) {
        const mappedRefer = refer.split('##').map(row => {
          const REFER_REF = /([①②③④⑤⑥]*[:：\s]+)?(.*)/;
          const splitedRefer = row.match(REFER_REF);
          const _referTitle = splitedRefer[1] ? splitedRefer[1].replace(/[:：\s]/, '') : '';
          const _referContent = splitedRefer[2];
          return {
            t: _referTitle,
            c: _referContent,
          }
        });
        newWord.add.ref = mappedRefer;
      }
    } catch (error) {
      console.error(`failed to parse ref for ${curWord}`)
      console.error(error);
    }

    try {
      if (oldPinyin) {
        const mappedOldPinyin = oldPinyin.split('##').map(row => {
          const REFER_REF = /([①②③④⑤⑥]*[:：\s]+)?(.*)/;
          const splitedRefer = row.match(REFER_REF);
          const _referTitle = splitedRefer[1] ? splitedRefer[1].replace(/[:：\s]/, '') : '';
          const _referContent = splitedRefer[2];
          return {
            t: _referTitle,
            c: _referContent,
          }
        });
        newWord.add.opys = mappedOldPinyin;
      }
    } catch (error) {
      console.error(`failed to parse old pinyin for ${curWord}`)
      console.error(error);
    }
  }

  fs.writeFileSync('output.2.json', JSON.stringify(docs));
}