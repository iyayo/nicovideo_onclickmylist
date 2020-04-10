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

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.message == "click") {
      const idRegex = /https:\/\/www\.nicovideo\.jp\/watch\/(..\d+)/;
      var url = sender.tab.url;
      var videoId = url.match(idRegex)[1];
      getVideoData(videoId).done(function (value) {
        const tokenRegex = /NicoAPI\.token = '(.*)';/;
        var item_type = $(value).find('[name="item_type"]').val();
        var item_id = $(value).find('[name="item_id"]').val();
        var item_amc = $(value).find('[name="item_amc"]').val();
        var token = value.match(tokenRegex)[1];
      });
    } else if (request.message == "mylist"){
      getMylist().done(function(value){
        var json = value.mylistgroup;
        sendResponse({data: json});
      });
    }

    return true;
  });
