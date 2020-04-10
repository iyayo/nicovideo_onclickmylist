chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      var url = sender.tab.url;
      if (request.message == "hello"){
        sendResponse({farewell: "goodbye"});
      }

      return true;
    });