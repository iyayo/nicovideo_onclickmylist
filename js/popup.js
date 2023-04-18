const mylistSelect = document.getElementById("mylistSelect");
const selected = mylistSelect.getElementsByClassName("active");
const memo = document.getElementById("memo");
const memoClearButton = document.getElementById("memoClearButton");
const options = document.forms["options"];
const mylistObject_base = document.getElementById("mylistObject-main");
const mylistObject_more = document.getElementById("mylistObject-more");
let previewMylist;

mylistSelect.addEventListener("click", e => {
    for (let i = 0; i < mylistSelect.children.length; i++) {
        mylistSelect.children[i].classList.remove("active");
    }

    e.target.classList.add("active");

    Promise.resolve()
    .then(setStorage)
    .then(() => previewMylistObject_firstPage(e.target.dataset.id, e.target.dataset.name))
});

mylistObject_more.addEventListener("click", () => {
    previewMylist.page = ++previewMylist.page;
    previewMylistObject_morePage();
});

memo.addEventListener("input", countMemoLength);

memoClearButton.addEventListener("click", () => {
    memo.value = null;
    countMemoLength();
});

options.addEventListener("change", setStorage);

Promise.resolve()
.then(checkUserSession)
.then(getMylist)
.then(getStorage)
.then(item => {
    for (let i = 0; i < mylistSelect.children.length; i++) {
        if (mylistSelect.children[i].dataset.id === item.nvocm_id) {
            mylistSelect.children[i].classList.add("active");
            
            previewMylistObject_firstPage(item.nvocm_id, item.nvocm_name);
        }
    }

    if (item.nvocm_desc !== undefined) memo.value = item.nvocm_desc;
    if (item.nvocm_notificationSound !== undefined) options.notificationSound.checked = item.nvocm_notificationSound;
    if (item.nvocm_clearNotificationsTime !== undefined) options.clearNotificationsTime.checked = item.nvocm_clearNotificationsTime;
})
.then(countMemoLength)
.catch(showAlert)

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
            for (let i = 0; i < arr.length; i++) {
                const mylistOption = document.createElement("li");
                mylistOption.innerText = arr[i].name;
                mylistOption.className = "list-group-item";
                mylistOption.dataset.id = arr[i].id;
                mylistOption.dataset.name = arr[i].name;
                mylistSelect.appendChild(mylistOption);
            }
            resolve();
        })
    })
}

function countMemoLength() {
    const memoLength = document.getElementById("memoLength");
    const count = memo.value.length;
    memoLength.innerText = count;

    Promise.resolve()
    .then(setStorage)

    if (count === 256) memoLength.style.color = "red";
    else memoLength.style.color = "";
}

function setStorage() {
    return new Promise((resolve, reject) => {
        const data = {
            nvocm_desc: memo.value,
            nvocm_notificationSound: options.notificationSound.checked,
            nvocm_clearNotificationsTime: options.clearNotificationsTime.checked
        }

        if (selected.length !== 0) {
            chrome.action.setBadgeBackgroundColor({color: "#0080ff"});
            chrome.action.setBadgeTextColor({color: "#fff"});
            chrome.action.setBadgeText({"text": String(selected[0].dataset.name)});

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

function showAlert(message) {
    const alertContainer = document.getElementById("alertContainer");
    const alertMessage = document.getElementById("alertMessage");

    alertContainer.classList.remove("d-none");
    alertMessage.innerHTML = message;
}

async function previewMylistObject_firstPage(mylistId, name) {
    previewMylist = new previewMylistObject(mylistId, name);

    previewMylist.reset();
    previewMylist.changeMylistName();
    let result = await previewMylist.getMylistObject();
    previewMylist.appendMylistObject(result);
}

async function previewMylistObject_morePage() {
    let result = await previewMylist.getMylistObject();
    previewMylist.appendMylistObject(result);
}

class previewMylistObject {
    static header = {
        "headers": {
            "x-frontend-id": "23",
            "x-request-with": "N-garage"
        },
        "method": "GET",
        "credentials": "include"
    }

    static mylistObjectList = document.getElementById("mylistObjectList");

    constructor (mylistId, name, type, page) {
        this.mylistId = mylistId;
        this.name = name;
        this.type = type;
        this.page = page;
    }

    reset () {
        this.page = 1;
        previewMylistObject.mylistObjectList.innerHTML = "";
    }

    changeMylistName () {
        const mylistName = document.getElementById("mylistName");
        mylistName.innerText = this.name;
    }

    async getMylistObject () {
        if (!this.page) this.page = 1;

        if (this.mylistId == "watch-later") {
            this.type = "watch-later"
            let response = await fetch(`https://nvapi.nicovideo.jp/v1/users/me/watch-later?sortKey=addedAt&sortOrder=desc&pageSize=100&page=${this.page}`, previewMylistObject.header);

            response = await response.json();
            return response;
        } else {
            this.type = "mylist";
            let response = await fetch(`https://nvapi.nicovideo.jp/v1/users/me/mylists/${this.mylistId}?pageSize=100&page=${this.page}`, previewMylistObject.header);
            
            response = await response.json();
            return response;
        }
    }

    appendMylistObject (obj) {
            let mylist;
            if (this.type == "watch-later") mylist = obj.data.watchLater;
            else mylist = obj.data.mylist;

            for (let i = 0; i < mylist.items.length; i++) {
                const object = mylist.items[i];
                const mylistObject_template = mylistObject_base.cloneNode(true);
                
                mylistObject_template.classList.remove("d-none");
                mylistObject_template.querySelector("#mylistObject-url").href = "https://www.nicovideo.jp/watch/" + object.video.id;
                mylistObject_template.querySelector("#mylistObject-bodyTitle").innerText = object.video.title;
                mylistObject_template.querySelector("#mylistObject-thumbnail").src = object.video.thumbnail.url;
                mylistObject_template.querySelector("#mylistObject-videoLength").innerText = this.timeConvert(object.video.duration);

                if (this.type == "watch-later") {
                    if (object.memo) {
                        mylistObject_template.querySelector("#mylistObject-memo").innerText = object.memo;
                        mylistObject_template.querySelector("#mylistObject-memo").classList.remove("d-none");
                    }
                } else {
                    if (object.description) {
                        mylistObject_template.querySelector("#mylistObject-memo").innerText = object.description;
                        mylistObject_template.querySelector("#mylistObject-memo").classList.remove("d-none");
                    }
                }

                previewMylistObject.mylistObjectList.append(mylistObject_template);
            }

            if (mylist.hasNext) {
                mylistObject_more.classList.remove("d-none");
            } else {
                mylistObject_more.classList.add("d-none");
            }
            
    }

    timeConvert (time) {
        let min = Math.floor(time / 60);
        let sec = time % 60;
    
        if (sec < 10) sec = "0" + sec;
    
        return min + ":" + sec;
    }
}