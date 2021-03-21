const navigation = document.getElementById("navigation");
const mainMenu = document.querySelectorAll("div#mainMenu > div");
const mylistSelect = document.getElementById("mylistSelect");
const comment = document.getElementById("comment");
const commentClearButton = document.getElementById("commentClearButton");
const saveButton = document.getElementById("saveButton");
const options = document.forms["options"];

navigation.addEventListener("click", e => {
    if (e.target.tagName !== "LI") return;
    mainMenu.forEach(m => {
        if (e.target.dataset.nav === m.id) m.style.display = "block";
        else m.style.display = "none";
    })
})

mylistSelect.addEventListener("change", setStatusText);

comment.addEventListener("input", countCommentLength);

commentClearButton.addEventListener("click", () => {
    comment.value = null;
    countCommentLength();
});

options.selectSize.addEventListener("change", e => mylistSelect.size = e.target.value);

saveButton.addEventListener("click", () => {
    Promise.resolve()
    .then(setStorage)
    .then(() => {
        if (options.autoClose.checked) window.close();

        saveButton.className = "complete";
        saveButton.style.width = "116px";
        
        setTimeout(() => {
            saveButton.innerText = "保存しました";
        }, 150);
    
        setTimeout(() => {
            saveButton.className = "";
            saveButton.style.width = "58px";
            saveButton.innerText = "保存";
        }, 2000);
    })
})

Promise.resolve()
.then(checkUserSession)
.then(getMylist)
.then(getStorage)
.then(item => {
    for (let i = 0; i < mylistSelect.options.length; i++) {
        if (mylistSelect.options[i].value === item.nvocm_id) mylistSelect.options[i].selected = true;
    }

    for (let i = 0; i < options.clearNotificationsTime.options.length; i++) {
        if (options.clearNotificationsTime.options[i].value === item.nvocm_clearNotificationsTime) options.clearNotificationsTime.options[i].selected = true;
    }

    if (item.nvocm_selectSize !== undefined && item.nvocm_selectSize > 1 && item.nvocm_selectSize < 11) {
        mylistSelect.size = item.nvocm_selectSize;
    }

    if (item.nvocm_desc !== undefined) comment.value = item.nvocm_desc;
    if (item.nvocm_selectSize !== undefined) options.selectSize.value = item.nvocm_selectSize;
    if (item.nvocm_autoClose !== undefined) options.autoClose.checked = item.nvocm_autoClose;
    if (item.nvocm_notificationSound !== undefined) options.notificationSound.checked = item.nvocm_notificationSound;
    if (item.nvocm_badgeMylistName !== undefined) options.badgeMylistName.checked = item.nvocm_badgeMylistName;
})
.then(setStatusText)
.then(countCommentLength)
.catch(error => {
    mainMenu[0].innerHTML = `<div id="errorMessage">${error}</div>`;
})

function checkUserSession(){
    return new Promise((resolve,reject) => {
        chrome.cookies.get({url:'https://www.nicovideo.jp/',name:'user_session'}, (value) => {
            if (value != null) resolve();
            else reject("マイリストの取得に失敗しました。<a href='https://account.nicovideo.jp/login' target='_blank'>ログイン</a>してから再度開いてください。");
        });
    })
}

function getMylist() {
    return new Promise((resolve, reject) => {
        fetch("http://www.nicovideo.jp/api/mylistgroup/list", { method: "GET" })
        .then(response => response.json())
        .then(obj => obj.mylistgroup)
        .then(arr => {
            console.log(arr);
            for (let i = 0; i < arr.length; i++) {
                const mylistOption = document.createElement("option");
                mylistOption.innerText = arr[i].name;
                mylistOption.value = arr[i].id;
                mylistOption.dataset.num = i + 1;
                mylistOption.dataset.name = arr[i].name;
                mylistOption.dataset.description = arr[i].description;
                mylistOption.dataset.url = "https://www.nicovideo.jp/my/mylist/" + arr[i].id;
                mylistSelect.appendChild(mylistOption);
            }
            resolve();
        })
    })
}

function countCommentLength() {
    const commentLength = document.getElementById("commentLength");
    const count = comment.value.length;
    commentLength.innerText = count;

    if (count === 256) commentLength.style.color = "red";
    else commentLength.style.color = "";
}

function setStatusText () {
    const statusText = document.getElementById("statusText");
    const statusLink = document.getElementById("statusLink");
    const index = mylistSelect.selectedIndex;

    if (index === -1) return;

    statusText.innerText = mylistSelect[index].innerText;
    statusLink.href = mylistSelect[index].dataset.url;
}

function setStorage() {
    return new Promise((resolve, reject) => {
        if (mylistSelect.selectedIndex !== -1) {
            if (options.badgeMylistName.checked) chrome.browserAction.setBadgeText({"text": String(mylistSelect.options[mylistSelect.selectedIndex].innerText)});
            else  chrome.browserAction.setBadgeText({"text": String(mylistSelect.selectedIndex + 1)});
        }
        
        chrome.storage.local.set({
            nvocm_id: mylistSelect.value,
            nvocm_desc: comment.value,
            nvocm_name: mylistSelect.options[mylistSelect.selectedIndex].innerText,
            nvocm_selectSize: options.selectSize.value,
            nvocm_autoClose: options.autoClose.checked,
            nvocm_notificationSound: options.notificationSound.checked,
            nvocm_clearNotificationsTime: options.clearNotificationsTime.options[options.clearNotificationsTime.options.selectedIndex].value,
            nvocm_badgeMylistName: options.badgeMylistName.checked
        }, () => resolve());
    })
}

function getStorage() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(null, item => resolve(item));
    })
}