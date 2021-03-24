const navigation = document.getElementById("navigation");
const mainMenu = document.querySelectorAll("div#mainMenu > div");
const mylistSelect = document.getElementById("mylistSelect");
const selected = mylistSelect.getElementsByClassName("selected");
const selectHeight = 50;
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

mylistSelect.addEventListener("click", e => {
    for (let i = 0; i < mylistSelect.children.length; i++) {
        mylistSelect.children[i].className = "";
    }

    e.target.className = "selected";
    setStatusText();
});

comment.addEventListener("input", countCommentLength);

commentClearButton.addEventListener("click", () => {
    comment.value = null;
    countCommentLength();
});

options.selectSize.addEventListener("change", e => mylistSelect.style.height = e.target.value * selectHeight + "px");

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
    for (let i = 0; i < mylistSelect.children.length; i++) {
        if (mylistSelect.children[i].dataset.id === item.nvocm_id) mylistSelect.children[i].className = "selected";
    }

    for (let i = 0; i < options.clearNotificationsTime.options.length; i++) {
        if (options.clearNotificationsTime.options[i].value === item.nvocm_clearNotificationsTime) options.clearNotificationsTime.options[i].selected = true;
    }

    if (item.nvocm_selectSize !== undefined && item.nvocm_selectSize > 1 && item.nvocm_selectSize < 11) {
        mylistSelect.style.height = item.nvocm_selectSize * selectHeight + "px";
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
        fetch("https://nvapi.nicovideo.jp/v1/users/me/mylists", { "headers": { "x-frontend-id": "6" }, "method": "GET" })
        .then(response => response.json())
        .then(obj => obj.data.mylists)
        .then(arr => {
            console.log(arr);
            for (let i = 0; i < arr.length; i++) {
                const mylistOption = document.createElement("li");
                const mylistNum = document.createElement("span");
                const mylistName = document.createElement("span");
                mylistNum.className = "mylistNum";
                mylistNum.innerText = i + 1 + ".";
                mylistName.className = "mylistName";
                mylistName.innerText = arr[i].name;
                mylistOption.dataset.id = arr[i].id;
                mylistOption.dataset.num = i + 1;
                mylistOption.dataset.name = arr[i].name;
                mylistOption.dataset.description = arr[i].description;
                mylistOption.dataset.url = "https://www.nicovideo.jp/my/mylist/" + arr[i].id;
                mylistSelect.appendChild(mylistOption);
                mylistOption.appendChild(mylistNum);
                mylistOption.appendChild(mylistName);
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
    if (selected.length === 0) return;
    const statusText = document.getElementById("statusText");
    const statusLink = document.getElementById("statusLink");

    statusText.innerText = selected[0].dataset.name;
    statusLink.href = selected[0].dataset.url;
}

function setStorage() {
    return new Promise((resolve, reject) => {
        const data = {
            nvocm_desc: comment.value,
            nvocm_selectSize: options.selectSize.value,
            nvocm_autoClose: options.autoClose.checked,
            nvocm_notificationSound: options.notificationSound.checked,
            nvocm_clearNotificationsTime: options.clearNotificationsTime.value,
            nvocm_badgeMylistName: options.badgeMylistName.checked
        }

        if (selected.length !== 0) {
            chrome.browserAction.setBadgeBackgroundColor({color: "#26a69a"});
            if (options.badgeMylistName.checked) chrome.browserAction.setBadgeText({"text": String(selected[0].dataset.name)});
            else  chrome.browserAction.setBadgeText({"text": String(selected[0].dataset.num)});

            data.nvocm_id = selected[0].dataset.id;
            data.nvocm_name = selected[0].dataset.name;
        }
        
        chrome.storage.local.set(data, () => resolve());
    })
}

function getStorage() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(null, item => resolve(item));
    })
}