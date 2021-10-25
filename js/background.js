// const regexVideoId = /https:\/\/www\.nicovideo\.jp\/watch\/(..\d+)/;
// const regexToken = /NicoAPI\.token = '(.*)';/;
// const regexItemType = /<input type="hidden" name="item_type" value="(.)">/;
// const regexItemId = /<input type="hidden" name="item_id" value="(.*)">/;
// const regexItemAmc = /<input type="hidden" name="item_amc" value="(.*)">/;

// const prop = {
//     type: "normal",
//     id: "onclick_mylist",
//     title: "マイリストに登録",
//     contexts: ["link"],
//     targetUrlPatterns: ["*://www.nicovideo.jp/watch/*"]
// };

// let notificationSound = false;
// let clearNotificationsTime = "disable";

// chrome.storage.local.get(["nvocm_notificationSound", "nvocm_clearNotificationsTime"], item => {
//     if (item.nvocm_notificationSound !== undefined) notificationSound = item.nvocm_notificationSound;
//     if (item.nvocm_clearNotificationsTime !== undefined) clearNotificationsTime = item.nvocm_clearNotificationsTime;
// })

// chrome.storage.local.onChanged.addListener(item => {
//     if (item.nvocm_notificationSound) notificationSound = item.nvocm_notificationSound.newValue;
//     if (item.nvocm_clearNotificationsTime) clearNotificationsTime = item.nvocm_clearNotificationsTime.newValue;
// });

// chrome.contextMenus.create(prop);
// chrome.contextMenus.onClicked.addListener((info) => {
//     const videoId = info.linkUrl.match(regexVideoId)[1];

//     Promise.resolve()
//     .then(() => checkUserSession())
//     .then(() => getStorageFormData())
//     .then(item => getFormData(videoId, item[0], item[1]))
//     .then(encodeData)
//     .then(addMylist)
//     .then(res => createNotification(res, notificationSound, clearNotificationsTime))
//     .catch(error => createNotification(error, notificationSound, clearNotificationsTime))
// });

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.message === "addMylist") {
//         const videoId = sender.tab.url.match(regexVideoId)[1];

//         Promise.resolve()
//         .then(() => checkUserSession())
//         .then(() => getStorageFormData())
//         .then(item => getFormData(videoId, item[0], item[1]))
//         .then(encodeData)
//         .then(addMylist)
//         .then(res => {
//             if (res.status === "ok") sendResponse("マイリストに登録しました");
//             else if (res.status === "fail") sendResponse(res.error.description);
//         })
//         .catch(error => sendResponse(error))
//     }

//     return true;
// })

// function checkUserSession(){
//     return new Promise((resolve,reject) => {
//         chrome.cookies.get({url:'https://www.nicovideo.jp/',name:'user_session'}, value => {
//             if (value !== null) resolve();
//             else reject("ログインされていません");
//         });
//     })
// }

// function getFormData(videoId, group_id, description) {
//     return new Promise ((resolve, reject) => {
//         fetch("https://www.nicovideo.jp/mylist_add/video/" + videoId)
//         .then(res => res.text())
//         .then(text => {
//             const obj = {
//                 group_id: group_id,
//                 item_type: text.match(regexItemType)[1],
//                 item_id: text.match(regexItemId)[1],
//                 description: description,
//                 item_amc: text.match(regexItemAmc)[1],
//                 token: text.match(regexToken)[1]
//             }

//             resolve(obj);
//         })
//     })
// }

// function getStorageFormData() {
//     return new Promise((resolve, reject) => {
//         chrome.storage.local.get(["nvocm_id", "nvocm_desc"], item => {
//             if (item.nvocm_id !== undefined) resolve([item.nvocm_id, item.nvocm_desc]);
//             else reject("登録先が設定されていません");
//         });
//     })
// }

// function encodeData(data) {
//     let encode = "";
//     for (let key in data) {
//         encode += key + "=" + data[key] + "&";
//     }
//     return encode;
// }

// function addMylist(data) {
//     return new Promise ((resolve, reject) => {
//         fetch("http://www.nicovideo.jp/api/mylist/add", { 
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/x-www-form-urlencoded"
//             },
//             body: data
//         })
//         .then(res => res.json())
//         .then(json => resolve(json))
//     })
// }

// function createNotification(res, silent, clear) {
//     let NotificationOptions = {
//         type: "basic",
//         title: "ワンクリックマイリスト",
//         message: "",
//         iconUrl: "icon/icon128.png",
//         silent: silent
//     }

//     if (res.status === "ok") NotificationOptions.message = "マイリストに登録しました";
//     else if (res.status === "fail") NotificationOptions.message = res.error.description;
//     else NotificationOptions.message = res;

//     chrome.notifications.create(NotificationOptions, notificationId => {
//         if (clear === "disable") return;
//         setTimeout(() => {
//             chrome.notifications.clear(notificationId);
//         }, clear);
//     });
// }