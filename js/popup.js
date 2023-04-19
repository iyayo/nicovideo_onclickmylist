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

function checkUserSession(){
    return new Promise((resolve,reject) => {
        chrome.cookies.get({url:'https://www.nicovideo.jp/',name:'user_session'}, (value) => {
            if (value != null) resolve();
            else {
                showToast("マイリストの取得に失敗しました。ログインしてから再度開いてください", false);
                reject();
            }
        });
    })
}

function getMylist() {
    return new Promise((resolve, reject) => {
        fetch("https://nvapi.nicovideo.jp/v1/users/me/mylists", { "headers": { "x-frontend-id": "6" }, "method": "GET" })
        .then(response => {
            if (response.status === 200) return response;
            else reject();
        })
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
        .catch(() => showToast("マイリストの取得に失敗しました", false))
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

function showToast(message, autohide) {
    const toastContainer = document.getElementsByClassName("toast-container")[0];
    const toast_base = document.getElementsByClassName("toast")[0];
    const toast_template = toast_base.cloneNode(true);

    toast_template.getElementsByClassName("toast-body")[0].innerText = message;
    const toast = new bootstrap.Toast(toast_template, {"autohide": autohide, "delay": 3000});

    toastContainer.append(toast_template);
    toast.show();
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
        const myllistName_url = document.getElementById("myllistName-url");
        if (this.mylistId == "watchlater") myllistName_url.href = "https://www.nicovideo.jp/my/watchlater";
        else myllistName_url.href = `https://www.nicovideo.jp/my/mylist/${this.mylistId}`;

        const mylistName = document.getElementById("mylistName");
        mylistName.innerText = this.name;
    }

    async getMylistObject () {
        if (!this.page) this.page = 1;

        if (this.mylistId == "watchlater") {
            this.type = "watchlater"
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
            if (this.type == "watchlater") {
                mylist = obj.data.watchLater;
                document.getElementById("mylistObject-itemscount").innerText = mylist.totalCount;
            } else {
                mylist = obj.data.mylist;
                document.getElementById("mylistObject-itemscount").innerText = mylist.totalItemCount;
            }

            for (let i = 0; i < mylist.items.length; i++) {
                const object = mylist.items[i];
                const mylistObject_template = mylistObject_base.cloneNode(true);
                
                mylistObject_template.dataset.itemid = object.itemId;
                mylistObject_template.classList.remove("d-none");
                mylistObject_template.querySelector("#mylistObject-url").href = "https://www.nicovideo.jp/watch/" + object.video.id;
                mylistObject_template.querySelector("#mylistObject-bodyTitle").innerText = object.video.title;
                mylistObject_template.querySelector("#mylistObject-thumbnail").src = object.video.thumbnail.url;
                mylistObject_template.querySelector("#mylistObject-videoLength").innerText = this.timeConvert(object.video.duration);
                mylistObject_template.querySelector("#mylistObject-action-delete").dataset.itemid = object.itemId;
                mylistObject_template.querySelector("#mylistObject-action-delete").addEventListener("click", element => { this.deleteMylistObject(element.target.dataset.itemid)});

                if (this.type == "watchlater") {
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

    deleteMylistObject(itemId) {
        let deleteMylistObject_url = `https://nvapi.nicovideo.jp/v1/users/me/mylists/${this.mylistId}/items?itemIds=${itemId}`;
        if (this.mylistId == "watchlater") deleteMylistObject_url = `https://nvapi.nicovideo.jp/v1/users/me/watch-later?itemIds=${itemId}`;

        fetch(deleteMylistObject_url, {
            "headers": {
                "x-frontend-id": "6",
                "x-request-with": "https://www.nicovideo.jp"
            },
            "method": "DELETE",
            "credentials": "include"
        })
        .then(response => {
            if (response.status === 200) {
                previewMylistObject.mylistObjectList.querySelector(`div[data-itemid="${itemId}"]`).remove();
                document.getElementById("mylistObject-itemscount").innerText = String(document.getElementById("mylistObject-itemscount").innerText) - 1;
                showToast("マイリストから削除しました", true);
            }
        })
        .catch(() => showToast("削除に失敗しました", false))
    }
}