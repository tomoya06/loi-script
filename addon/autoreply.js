(function() {
  window.onload = doReply;

  let queueLength = 0;
  let queueFlag = false;

  function doReply() {
    const $msgListContainer = $("#listContainer.message_list");
    const $msgList = $msgListContainer.children(".message_item");
    logger.log(`GOT ${$msgList.length} msg(s)`);
    for (let i = 0; i < $msgList.length; i += 1) {
      const $curMsg = $($msgList.get(i));
      if ($curMsg.hasClass("replyed")) {
        logger.log(`msg ${i} is replyed. abort`);
        continue;
      }
      const $textMsg = $curMsg.find(".message_content.text .wxMsg");
      if ($textMsg.length === 0) {
        logger.log(`msg ${i} is not text`);
        continue;
      }
      const curMsg = $textMsg.text();
      logger.log(`msg ${i}: ${curMsg}`);
      submitQueue();

      let cmd;
      cmd = LoilangController.parseLoilangMsg(curMsg);
      if (cmd !== null) {
        LoilangController.handleLoilangCommand(cmd)
          .then(data => {
            logger.log(`api result for msg ${i}: ${data}`);
            replyMessage($curMsg, `字典回复：${data}`);
          })
          .catch(error => {
            logger.log(`error for msg ${i}: ${error}`);
            replyMessage($curMsg, `字典说出错了：${error}`);
          })
          .finally(() => {
            finishQueue();
          });
      }
      /**
       * If there are other type of command, do like above.
       *
       *  */
      if (cmd === null) {
        handleNonCommand($curMsg, curMsg);
      }
    }

    idleReload();
  }

  function submitQueue() {
    queueLength += 1;
    queueFlag = true;
  }

  function finishQueue() {
    queueLength -= 1;
    idleReload();
  }

  /**
   * when all
   */
  function idleReload() {
    if (queueLength !== 0) {
      logger.log(`Waiting for ${queueLength} message(s) to be handled...`);
      return;
    }
    let reloadTime;
    if (queueFlag === false) {
      reloadTime = 5000;
    } else {
      reloadTime = 1000;
    }
    logger.log(`All messages have been handled. This page will reload in ${reloadTime}ms...`);
    setTimeout(() => {
      location.reload();
    }, reloadTime);
  }

  /**
   * deal with non-cmd
   * @param {String} msg
   */
  function handleNonCommand($curMsg, msg) {
    logger.log(`non-cmd msg: ${msg}`);
    replyMessage($curMsg, `${msg}${msg}`);
  }

  function replyMessage($curMsg, msg) {
    const $replyBtn = $($curMsg)
      .find(".message_opr a.js_reply")
      .get(0);
    $replyBtn.click();

    const $inputBox = $($curMsg)
      .find(".quick_reply_box .edit_area")
      .get(1);
    $($inputBox).html(msg);

    const $sendBtn = $($curMsg)
      .find(".quick_reply_box .js_reply_OK")
      .get(0);
    $sendBtn.click();

    const $pickupBtn = $($curMsg)
      .find(".quick_reply_box .js_reply_pickup")
      .get(0);
    $pickupBtn.click();
  }
})();
