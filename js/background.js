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
        iconUrl: "/icon/icon128.png",
        silent: silent
    }

    NotificationOptions.message = res;

    chrome.notifications.create(NotificationOptions, notificationId => {
        if (!clear) return;
        chrome.alarms.create(notificationId, {"delayInMinutes": 1})
    });
}