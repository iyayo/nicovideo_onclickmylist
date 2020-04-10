function getMylist(){
  return $.ajax({
    url: 'http://www.nicovideo.jp/api/mylistgroup/list',
    type: 'GET',
    dataType: 'json'
  })
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      var url = sender.tab.url;
      if (request.message == "click"){
        sendResponse({status: "goodbye"});
      }

      return true;
    });
