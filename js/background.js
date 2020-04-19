function getMylist() {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: 'http://www.nicovideo.jp/api/mylistgroup/list',
            type: 'GET',
            dataType: 'json'
        })
        .done((result) => {
            resolve(result.mylistgroup);
        })
    })
}

function getStorageMylist(){
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('nvocm', (value) => {
            if(value.nvocm !== undefined){
                resolve(value.nvocm);
            } else {
                reject("登録先が指定されていません");
            }
        });
    })
}

function getVideoData(videoId, group_id) {
    return new Promise((resolve,reject) => {
        $.ajax({
            url: 'https://www.nicovideo.jp/mylist_add/video/' + videoId,
            type: 'GET',
            dataType: 'html'
        })
        .done((result) => {
            const tokenRegex = /NicoAPI\.token = '(.*)';/;
            var json = {
                group_id: group_id,
                item_type: $(result).find('[name="item_type"]').val(),
                item_id: $(result).find('[name="item_id"]').val(),
                item_amc: $(result).find('[name="item_amc"]').val(),
                token: result.match(tokenRegex)[1]
            };
            resolve(json);
        })
    })
}

function addMylist(data){
    return new Promise((resolve,reject) => {
        $.ajax({
            url: 'http://www.nicovideo.jp/api/mylist/add',
            type: 'POST',
            dataType: 'json',
            data: {
                "group_id": data.group_id,
                "item_type": data.item_type,
                "item_id": data.item_id,
                "description": null,
                "item_amc": data.item_amc,
                "token": data.token
            }
        })
        .done((result) => {
            if (result.status == "ok") {
                resolve("マイリストに登録しました");
            } else {
                resolve(result.error.description);
            }
        })
    })
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message == "click") {
        const idRegex = /https:\/\/www\.nicovideo\.jp\/watch\/(..\d+)/;
        var url = sender.tab.url;
        var videoId = url.match(idRegex)[1];
        getStorageMylist()
        .then((result) => {
            return result;
        })
        .then((result) => {
            return getVideoData(videoId, result);
        })
        .then((result) => {
            return addMylist(result);
        })
        .then((result) => {
            sendResponse({ status: result});
        })
        .catch((error) => {
            sendResponse({ status: error });
        });
    } else if (request.message == "mylist") {
        getMylist()
        .then((result) => {
            sendResponse({ data: result });
        });
    }
    return true;
});

const prop = {
    type: "normal",
    id: "onclick_mylist",
    title: "マイリストに登録",
    contexts: ["link"],
    targetUrlPatterns: ["*://*.nicovideo.jp/watch/*"]
};

chrome.contextMenus.create(prop, function(){});

chrome.contextMenus.onClicked.addListener((info) => {
    const idRegex = /https:\/\/www\.nicovideo\.jp\/watch\/(..\d+)/;
    var url = info.linkUrl;
    var videoId = url.match(idRegex)[1];
    
    getStorageMylist()
    .then((result) => {
            return result;
    })
    .then((result) => {
            return getVideoData(videoId, result);
    })
    .then((result) => {
            return addMylist(result);
    })
    .then((result) => {
           console.log(result);
    })
    .catch((error) => {
            console.log(error); 
    });
});