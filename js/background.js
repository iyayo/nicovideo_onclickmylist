const regexVideoId = /https:\/\/www\.nicovideo\.jp\/watch\/(..\d+)/;

const prop = {
    type: "normal",
    id: "onclick_mylist",
    title: "マイリストに登録",
    contexts: ["link"],
    targetUrlPatterns: ["*://www.nicovideo.jp/watch/*"]
};

let notificationSound = false;
let clearNotificationsTime = "disable";

chrome.storage.local.get(["nvocm_notificationSound", "nvocm_clearNotificationsTime"], item => {
    if (item.nvocm_notificationSound !== undefined) notificationSound = item.nvocm_notificationSound;
    if (item.nvocm_clearNotificationsTime !== undefined) clearNotificationsTime = item.nvocm_clearNotificationsTime;
})

chrome.storage.local.onChanged.addListener(item => {
    if (item.nvocm_notificationSound) notificationSound = item.nvocm_notificationSound.newValue;
    if (item.nvocm_clearNotificationsTime) clearNotificationsTime = item.nvocm_clearNotificationsTime.newValue;
});

chrome.contextMenus.create(prop);
chrome.contextMenus.onClicked.addListener((info) => {
    const videoId = info.linkUrl.match(regexVideoId)[1];

    Promise.resolve()
    .then(() => checkUserSession())
    .then(() => getStorageFormData())
    .then(item => {
        if (item[0] === "watchlater") return addWatchLater(videoId, encodeURIComponent(item[1]));
        else return addMylist(item[0], videoId, encodeURIComponent(item[1]));
    })
    .then(res => createNotification(res, notificationSound, clearNotificationsTime))
    .catch(error => createNotification(error, notificationSound, clearNotificationsTime))
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "addMylist") {
        const videoId = sender.tab.url.match(regexVideoId)[1];

        Promise.resolve()
        .then(() => checkUserSession())
        .then(() => getStorageFormData())
        .then(item => {
            if (item[0] === "watchlater") return addWatchLater(videoId, encodeURIComponent(item[1]));
            else  return addMylist(item[0], videoId, encodeURIComponent(item[1]));
        })
        .then(res => sendResponse(res))
        .catch(error => sendResponse(error))
    }

    return true;
})

function checkUserSession(){
    return new Promise((resolve,reject) => {
        chrome.cookies.get({url:'https://www.nicovideo.jp/',name:'user_session'}, value => {
            if (value !== null) resolve();
            else reject("ログインされていません");
        });
    })
}

function getStorageFormData() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(["nvocm_id", "nvocm_desc"], item => {
            if (item.nvocm_id !== undefined) resolve([item.nvocm_id, item.nvocm_desc]);
            else reject("登録先が設定されていません");
        });
    })
}

function addWatchLater(videoId, description) {
    return new Promise ((resolve, reject) => {
        fetch(`https://nvapi.nicovideo.jp/v1/users/me/watch-later?watchId=${videoId}&memo=${description}`, {
            "headers": {
                "x-frontend-id": "23",
                "x-request-with": "N-garage"
            },
            "method": "POST",
            "credentials": "include"
        })
        .then(res => {
            if (res.status === 201) resolve("あとで見るに登録しました");
            else if (res.status === 409) resolve("あとで見るに登録済みです");
            else resolve("登録に失敗しました");
        })
    })
}

function addMylist(mylistId, videoId, description) {
    return new Promise ((resolve, reject) => {
        fetch(`https://nvapi.nicovideo.jp/v1/users/me/mylists/${mylistId}/items?itemId=${videoId}&description=${description}`, {
            "headers": {
                "x-frontend-id": "23",
                "x-request-with": "N-garage"
            },
            "method": "POST",
            "credentials": "include"
        })
        .then(res => {
            console.log(res);
            if (res.status === 201) resolve("マイリストに登録しました");
            else if (res.status === 200) resolve("マイリストに登録済みです");
            else resolve("登録に失敗しました");
        })
    })
}

function createNotification(res, silent, clear) {
    let NotificationOptions = {
        type: "basic",
        title: "ワンクリックマイリスト",
        message: "",
        iconUrl: "icon/icon128.png",
        silent: silent
    }

    NotificationOptions.message = res;

    chrome.notifications.create(NotificationOptions, notificationId => {
        if (clear === "disable") return;
        setTimeout(() => {
            chrome.notifications.clear(notificationId);
        }, clear);
    });
}

function rewriteRequestHeader(details) {
    var Origin = {
        name: "Origin",
        value: "https://www.nicovideo.jp"
    }

    details.requestHeaders.push(Origin);
    return { requestHeaders: details.requestHeaders };
}

chrome.webRequest.onBeforeSendHeaders.addListener(
    rewriteRequestHeader,
    { urls: ["https://nvapi.nicovideo.jp/v1/users/me/*"] },
    ["requestHeaders", "extraHeaders", "blocking"]
);