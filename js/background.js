function getMylist() {
  return $.ajax({
    url: 'http://www.nicovideo.jp/api/mylistgroup/list',
    type: 'GET',
    dataType: 'json'
  })
}

function getVideoData(videoId) {
  return $.ajax({
    url: 'https://www.nicovideo.jp/mylist_add/video/' + videoId,
    type: 'GET',
    dataType: 'html'
  })
}

function getStorageMylist(){
  return new Promise((resolve, reject) => {
      chrome.storage.local.get('nvocm', function(value){
          resolve(value.nvocm);
      });
  })
}

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.message == "click") {
      const idRegex = /https:\/\/www\.nicovideo\.jp\/watch\/(..\d+)/;
      var url = sender.tab.url;
      var videoId = url.match(idRegex)[1];

      getStorageMylist().then(function(group_id){
        if (group_id !== undefined){
          getVideoData(videoId).done(function (value) {
            const tokenRegex = /NicoAPI\.token = '(.*)';/;
            var item_type = $(value).find('[name="item_type"]').val();
            var item_id = $(value).find('[name="item_id"]').val();
            var item_amc = $(value).find('[name="item_amc"]').val();
            var token = value.match(tokenRegex)[1];
          });
        } else {
          sendResponse({status: "登録先が設定されていません"})
        }
      })
    } else if (request.message == "mylist"){
      getMylist().done(function(value){
        var json = value.mylistgroup;
        sendResponse({data: json});
      });
    }

    return true;
  });
