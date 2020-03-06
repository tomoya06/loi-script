(function() {
  const host = "http://localhost:8080";

  /**
   * parse command from msg
   * @param {String} msg
   */
  function parseLoilangMsg(msg) {
    const cmdReg = /^字典(加字|看字|查字|加音|删音|删字)(\s+[\u4e00-\u9fa5]+)(\s+\w+){0,1}\s*$/;
    if (!cmdReg.test(msg)) {
      return null;
    }
    const args = msg
      .replace(cmdReg, "$1 $2 $3")
      .trim()
      .split(/\s+/);
    return args;
  }

  /**
   * deal with loilang cmd. return reply msg
   * @param {String[]} cmd
   */
  function handleLoilangCommand(cmd) {
    const [cmdName, arg, arg0] = cmd;
    switch (cmdName) {
      case "加字":
        return _handleCreateWord(arg, arg0);
      case "看字":
        return _handleGetWord(arg);
      case "查字":
        return _handleSearchWord(arg);
    }
  }

  function _handleCreateWord(arg, arg0) {
    return new Promise((resolve, reject) => {
      if (!arg0) {
        return reject("请提供下拼音~");
      }
      const api = `${host}/loilang/create`;
      GM_xmlhttpRequest({
        method: "POST",
        url: api,
        data: JSON.stringify({
          word: arg,
          pinyin: arg0,
          type: "NORMAL"
        }),
        headers: {
          "Content-Type": "application/json"
        },
        onload: result => {
          if (result.status === 200) {
            return resolve(`加好了`);
          }
          return reject(`不让加了。[${result.status}]`);
        }
      });
    });
  }

  function _handleGetWord(arg) {
    return new Promise((resolve, reject) => {
      const api = `${host}/loilang/get?word=${arg}`;
      GM_xmlhttpRequest({
        method: "GET",
        url: api,
        onload: result => {
          if (result.status === 200) {
            const { data } = JSON.parse(result.responseText);
            const pinyinRpy = data.pinyins.map(py => `'${py}'`).join("、");
            const reply = `「${data.word}」字有${data.pinyins.length}个读音：${pinyinRpy}。`;
            return resolve(reply);
          }
          return reject(`没这个字啊，加一个吧。[${result.status}]`);
        }
      });
    });
  }

  function _handleSearchWord(arg) {
    return new Promise((resolve, reject) => {
      const api = `${host}/loilang/search?query=${arg}`;
      GM_xmlhttpRequest({
        method: "GET",
        url: api,
        onload: result => {
          if (result.status === 200) {
            const { data } = JSON.parse(result.responseText);
            const listRpl = data
              .map(
                ({ word, pinyins }, index) =>
                  `#${index + 1}：${word}(${pinyins.length}个读音)；`
              )
              .join("<br>");
            const reply = `共${data.length}个搜索结果：<br>${listRpl}<br>回复"字典看字 [你要的字]"查看详情。`;
            return resolve(reply);
          }
          return reject(`搜不到哇QQ [${result.status}]`);
        }
      });
    });
  }

  window.LoilangController = {
    parseLoilangMsg,
    handleLoilangCommand
  };
})();
