const regexVideoId = /https:\/\/www\.nicovideo\.jp\/watch\/(..\d+)/;
let notificationSound = false;
let clearNotificationsTime = false;
let match_itemId = "";

chrome.storage.local.get(["nvocm_notificationSound", "nvocm_clearNotificationsTime"], item => {
    if (item.nvocm_notificationSound !== undefined) notificationSound = item.nvocm_notificationSound;
    if (item.nvocm_clearNotificationsTime !== undefined) clearNotificationsTime = item.nvocm_clearNotificationsTime;
})

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.removeAll()
    chrome.contextMenus.create({
        type: "normal",
        id: "onclick_mylist",
        title: "マイリストに登録",
        contexts: ["link"],
        targetUrlPatterns: ["*://www.nicovideo.jp/watch/*"]
    })

    chrome.storage.local.get(["nvocm_clearNotificationsTime"], item => {
        let isChecked;

        if (item.nvocm_clearNotificationsTime === "disable") isChecked = false;
        else if (item.nvocm_clearNotificationsTime === "5000" || item.nvocm_clearNotificationsTime === "7000" || item.nvocm_clearNotificationsTime === "15000") isChecked = true;
        else return;
        
        chrome.storage.local.set({"nvocm_clearNotificationsTime": isChecked}, () => clearNotificationsTime = isChecked)
    })

    chrome.storage.local.remove(["nvocm_selectSize", "nvocm_autoClose", "nvocm_badgeMylistName"]);
});

chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get(["nvocm_name"], item => {
        if (item.nvocm_name !== undefined) {
            chrome.action.setBadgeBackgroundColor({color: "#0080ff"});
            chrome.action.setBadgeTextColor({color: "#fff"});
            chrome.action.setBadgeText({"text": item.nvocm_name})
        };
    })
});

chrome.storage.local.onChanged.addListener(item => {
    if (item.nvocm_notificationSound) notificationSound = item.nvocm_notificationSound.newValue;
    if (item.nvocm_clearNotificationsTime) clearNotificationsTime = item.nvocm_clearNotificationsTime.newValue;
});

chrome.contextMenus.onClicked.addListener((info) => {
    const videoId = info.linkUrl.match(regexVideoId)[1];

    Promise.resolve()
    .then(() => checkUserSession())
    .then(() => getStorageFormData())
    .then(item => addMylist(item[0], videoId, encodeURIComponent(item[1])))
    .then(res => createNotification(res, notificationSound, clearNotificationsTime))
    .catch(error => createNotification(error, notificationSound, clearNotificationsTime))
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "addMylist") {
        const videoId = sender.tab.url.match(regexVideoId)[1];

        Promise.resolve()
        .then(() => checkUserSession())
        .then(() => getStorageFormData())
        .then(item => addMylist(item[0], videoId, encodeURIComponent(item[1])))
        .then(res => sendResponse(res))
        .catch(error => sendResponse(error))
    } else if (request.message === "checkMylist") {
        const videoId = sender.tab.url.match(regexVideoId)[1];

        Promise.resolve()
        .then(() => checkUserSession())
        .then(() => getStorageFormData())
        .then(item => getMylistInfo(item[0], videoId))
        .then(res => {
            if (res) sendResponse(true);
            else sendResponse(false);
        })
    }

    else if (request.message === "deleteMylist") {
        Promise.resolve()
        .then(() => checkUserSession())
        .then(() => getStorageFormData())
        .then(item => deleteMylist(item[0], match_itemId))
        .then(res => sendResponse(res))
        .catch(error => sendResponse(error))
    }

    return true;
})

chrome.alarms.onAlarm.addListener(alarm => {
    chrome.notifications.clear(alarm.name);
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

function addMylist(mylistId, videoId, description) {
    return new Promise ((resolve, reject) => {
        if (mylistId == "watchlater") {
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
        } else {
            fetch(`https://nvapi.nicovideo.jp/v1/users/me/mylists/${mylistId}/items?itemId=${videoId}&description=${description}`, {
                "headers": {
                    "x-frontend-id": "23",
                    "x-request-with": "N-garage"
                },
                "method": "POST",
                "credentials": "include"
            })
            .then(res => {
                if (res.status === 201) resolve("マイリストに登録しました");
                else if (res.status === 200) resolve("マイリストに登録済みです");
                else resolve("登録に失敗しました");
            })
        }
    })
}

function deleteMylist(mylistId, itemId) {
    return new Promise ((resolve, reject) => {
        if (mylistId == "watchlater") {
            fetch(`https://nvapi.nicovideo.jp/v1/users/me/watch-later?itemIds=${itemId}`, {
                "headers": {
                    "x-frontend-id": "23",
                    "x-request-with": "N-garage"
                },
                "method": "DELETE",
                "credentials": "include"
            })
            .then(res => {
                if (res.status === 200) resolve("マイリストから削除しました");
                else resolve("削除に失敗しました");
            })
        } else {
            fetch(`https://nvapi.nicovideo.jp/v1/users/me/mylists/${mylistId}/items?itemIds=${itemId}`, {
                "headers": {
                    "x-frontend-id": "23",
                    "x-request-with": "N-garage"
                },
                "method": "DELETE",
                "credentials": "include"
            })
            .then(res => {
                if (res.status === 200) resolve("マイリストから削除しました");
                else resolve("削除に失敗しました");
            })
        }
    })
}

async function getMylistInfo(id, videoId) {
    let hasNext = true;
    let match = false;
    match_itemId = "";

    for (let page = 1; hasNext && !match && page < 6; page++){
        await myFunc(page, id, videoId);
    }

    return match;

    async function myFunc(page, id, videoId) {
        return new Promise((resolve) => {
            if (id === "watchlater") {
                fetch(`https://nvapi.nicovideo.jp/v1/users/me/watch-later?sortKey=addedAt&sortOrder=desc&pageSize=100&page=${page}`, { "headers": { "x-frontend-id": "6" }, "method": "GET" })
                .then(response => response.json())
                .then(obj => obj.data.watchLater)
                .then(mylist => {
                    hasNext = mylist.hasNext;
    
                    for (let i = 0; i < mylist.items.length; i++) {
                        const item = mylist.items[i];
    
                        if (item.watchId == videoId) {
                            match = true;
                            match_itemId = item.itemId;
                        } 
                    }
    
                    resolve();
                })
            } else {
                fetch("https://nvapi.nicovideo.jp/v1/users/me/mylists/" + id + `?page=${page}&pageSize=100`, { "headers": { "x-frontend-id": "6" }, "method": "GET" })
                .then(response => response.json())
                .then(obj => obj.data.mylist)
                .then(mylist => {
                    hasNext = mylist.hasNext;
    
                    for (let i = 0; i < mylist.items.length; i++) {
                        const item = mylist.items[i];
    
                        if (item.watchId == videoId) {
                            match = true;
                            match_itemId = item.itemId;
                        } 
                    }
    
                    resolve();
                })
            }
        });
    }
}

function createNotification(res, silent, clear) {
    let NotificationOptions = {
        type: "basic",
        title: "ワンクリックマイリスト",
        message: "",
        iconUrl: "data:image/png;base64,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",
        silent: silent
    }

    NotificationOptions.message = res;

    chrome.notifications.create(NotificationOptions, notificationId => {
        if (!clear) return;
        chrome.alarms.create(notificationId, {"delayInMinutes": 1})
    });
}