const $ = window.jQuery;

(function() {
  window.onload = doReply;

  function doReply() {
    const $msgListContainer = $("#listContainer.message_list");
    const $msgList = $msgListContainer.children(".message_item");
    console.log(`GOT ${$msgList.length} msg(s)`);
    for (let i = 0; i < $msgList.length; i += 1) {
      const $curMsg = $($msgList.get(i));
      if ($curMsg.hasClass("replyed")) {
        console.log(`msg ${i} is replyed`);
        continue;
      }
      const $textMsg = $curMsg.find(".message_content.text .wxMsg");
      console.log($textMsg);
      if ($textMsg.length === 0) {
        continue;
      }
      const curMsg = $textMsg.text();
      console.log(`msg ${i}: ${curMsg}`);
    }
  }

  function handleMsgCommand(msg) {
    
  }
})();
