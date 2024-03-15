const mylistSelect = document.getElementById("mylistSelect");
const selected = mylistSelect.getElementsByClassName("active");
const memo = document.getElementById("memo");
const memoClearButton = document.getElementById("memoClearButton");
const options = document.forms["options"];
const mylistObject_more = document.getElementById("mylistObject-more");
const nicorepo_reload = document.getElementById("nicorepo-reload");
const nicorepo_more = document.getElementById("nicorepo-more");

class localStorage {
    set() {
        return new Promise((resolve, reject) => {
            const data = {
                nvocm_desc: memo.value,
                nvocm_notificationSound: options.notificationSound.checked,
                nvocm_clearNotificationsTime: options.clearNotificationsTime.checked,
                nvocm_wayOpenVideo: options.wayOpenVideo.value,
                nvocm_theme: options.theme.value
            }

            if (selected.length !== 0) {
                chrome.action.setBadgeBackgroundColor({ color: "#0080ff" });
                chrome.action.setBadgeTextColor({ color: "#fff" });
                chrome.action.setBadgeText({ "text": String(selected[0].dataset.name) });

                data.nvocm_id = selected[0].dataset.id;
                data.nvocm_name = selected[0].dataset.name;
            }

            chrome.storage.local.set(data, () => resolve());
        })
    }

    async get(key = null) {
        return await chrome.storage.local.get(key);
    }

    restore(item) {
        for (let i = 0; i < mylistSelect.children.length; i++) {
            if (mylistSelect.children[i].dataset.id === item.nvocm_id) {
                mylistSelect.children[i].classList.add("active");

                previewMylistObject_firstPage(item.nvocm_id, item.nvocm_name);
            }
        }

        if (item.nvocm_desc !== undefined) memo.value = item.nvocm_desc;
        if (item.nvocm_notificationSound !== undefined) options.notificationSound.checked = item.nvocm_notificationSound;
        if (item.nvocm_clearNotificationsTime !== undefined) options.clearNotificationsTime.checked = item.nvocm_clearNotificationsTime;

        if (item.nvocm_wayOpenVideo !== undefined) {
            options.querySelectorAll("#wayOpenVideo > option").forEach(element => {
                if (element.value === item.nvocm_wayOpenVideo) element.selected = true;
            })
        }

        if (item.nvocm_theme !== undefined) {
            options.querySelectorAll("#theme > option").forEach(element => {
                if (element.value === item.nvocm_theme) element.selected = true;
            })
        }
    }
}

class previewMylistObject {
    header = {
        "get": {
            "headers": {
                "x-frontend-id": "23",
                "x-request-with": "N-garage"
            },
            "method": "GET",
            "credentials": "include"
        },
        "delete": {
            "headers": {
                "x-frontend-id": "6",
                "x-request-with": "https://www.nicovideo.jp"
            },
            "method": "DELETE",
            "credentials": "include"
        }
    }

    static mylistObjectList = document.getElementById("mylistObjectList");
    static mylistObject_base = document.getElementById("mylistObject-main");
    static mylistObject_itemscount = document.getElementById("mylistObject-itemscount");

    constructor(mylistId, name, page) {
        this.mylistId = mylistId;
        this.name = name;
        this.page = page;
    }

    reset() {
        this.page = 1;
        previewMylistObject.mylistObjectList.innerHTML = "";
        previewMylistObject.mylistObject_itemscount.innerText = "";
        mylistObject_more.classList.add("d-none");
    }

    changeMylistName() {
        const myllistName_url = document.getElementById("myllistName-url");
        if (this.mylistId == "watchlater") myllistName_url.href = "https://www.nicovideo.jp/my/watchlater";
        else myllistName_url.href = `https://www.nicovideo.jp/my/mylist/${this.mylistId}`;

        const mylistName = document.getElementById("mylistName");
        mylistName.innerText = this.name;
    }

    async getMylistObject() {
        if (!this.page) this.page = 1;
        let getMylistObject_url = `https://nvapi.nicovideo.jp/v1/users/me/mylists/${this.mylistId}?pageSize=100&page=${this.page}`;
        if (this.mylistId == "watchlater") getMylistObject_url = `https://nvapi.nicovideo.jp/v1/users/me/watch-later?sortKey=addedAt&sortOrder=desc&pageSize=100&page=${this.page}`;

        try {
            let response = await fetch(getMylistObject_url, this.header.get);
            response = await response.json();

            return response;
        } catch (error) {
            showToast("マイリストの読み込みに失敗しました", false);
        }
    }

    appendMylistObject(obj) {
        let mylist;
        if (this.mylistId == "watchlater") {
            mylist = obj.data.watchLater;
            previewMylistObject.mylistObject_itemscount.innerText = mylist.totalCount;
        } else {
            mylist = obj.data.mylist;
            previewMylistObject.mylistObject_itemscount.innerText = mylist.totalItemCount;
        }

        for (let i = 0; i < mylist.items.length; i++) {
            const object = mylist.items[i];
            const mylistObject_template = previewMylistObject.mylistObject_base.cloneNode(true);

            mylistObject_template.dataset.itemid = object.itemId;
            mylistObject_template.classList.remove("d-none");
            mylistObject_template.querySelector("#mylistObject-url").href = "https://www.nicovideo.jp/watch/" + object.video.id;
            mylistObject_template.querySelector("#mylistObject-bodyTitle").innerText = object.video.title;
            mylistObject_template.querySelector("#mylistObject-thumbnail").src = object.video.thumbnail.url;
            mylistObject_template.querySelector("#mylistObject-videoLength").innerText = this.timeConvert(object.video.duration);
            mylistObject_template.querySelector("#mylistObject-action-delete").dataset.itemid = object.itemId;
            mylistObject_template.querySelector("#mylistObject-action-delete").addEventListener("click", element => { this.deleteMylistObject(element.target.dataset.itemid) });

            mylistObject_template.querySelector("#mylistObject-url").addEventListener("click", event => {
                if (options.wayOpenVideo.value === "currentTab") {
                    chrome.tabs.query({ active: true, currentWindow: true, lastFocusedWindow: true }, tab => {
                        chrome.tabs.update(tab[0].id, { url: mylistObject_template.querySelector("#mylistObject-url").href })
                    })

                    event.preventDefault();
                }
            })

            if (this.mylistId == "watchlater") {
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

    timeConvert(time) {
        let min = Math.floor(time / 60);
        let sec = time % 60;

        if (sec < 10) sec = "0" + sec;

        return min + ":" + sec;
    }

    async deleteMylistObject(itemId) {
        let deleteMylistObject_url = `https://nvapi.nicovideo.jp/v1/users/me/mylists/${this.mylistId}/items?itemIds=${itemId}`;
        if (this.mylistId == "watchlater") deleteMylistObject_url = `https://nvapi.nicovideo.jp/v1/users/me/watch-later?itemIds=${itemId}`;

        try {
            const response = await fetch(deleteMylistObject_url, this.header.delete);

            if (response.status !== 200) return;

            previewMylistObject.mylistObjectList.querySelector(`div[data-itemid="${itemId}"]`).remove();
            previewMylistObject.mylistObject_itemscount.innerText = String(previewMylistObject.mylistObject_itemscount.innerText) - 1;
            showToast("マイリストから削除しました", true);
        } catch (error) {
            showToast("削除に失敗しました", false);
        }
    }
}

class NicoRepo {
    header = {
        "headers": {
            "x-frontend-id": "6"
        },
        "method": "GET",
        "credentials": "include"
    }

    untilId = "";

    nicorepoObjectList = document.getElementById("nicorepoObjectList");
    nicorepoObject_base = document.getElementById("nicorepoObject-main");
    
    constructor() {
        this.nicorepoObjectList.innerHTML = "";
        nicorepo_more.classList.add("d-none");
    }

    async get_nicorepo() {
        try {
            let response = await fetch(`https://api.repoline.nicovideo.jp/v1/timelines/nicorepo/last-1-month/my/pc/entries.json?object%5Btype%5D=video&type=upload&untilId=${this.untilId}`, this.header);
            response = await response.json();

            this.untilId = response.meta.minId;
    
            return response;
        } catch (error) {
            showToast("ニコレポの読み込みに失敗しました", false);
        }
    }

    append_nicorepo(result) {
        for (let i = 0; i < result.data.length; i++) {
            const object = result.data[i];
            const nicorepoObject_template = this.nicorepoObject_base.cloneNode(true);
    
            nicorepoObject_template.classList.remove("d-none");
            nicorepoObject_template.querySelector("#nicorepoObject-icon").src = object.actor.icon;
            nicorepoObject_template.querySelector("#nicorepoObject-user").href = object.actor.url;
            nicorepoObject_template.querySelector("#nicorepoObject-name").innerText = object.actor.name;
            
            const date = this.updated_date_convert(object.updated);
            nicorepoObject_template.querySelector("#nicorepoObject-updated").innerText = date;

            if (date < 24) {
                nicorepoObject_template.querySelector("#nicorepoObject-updated").innerText += "時間前";
                nicorepoObject_template.querySelector("#nicorepoObject-updated").classList.add("new");
            }

            nicorepoObject_template.querySelector("#nicorepoObject-url").href = object.object.url;
            nicorepoObject_template.querySelector("#nicorepoObject-bodyTitle").innerText = object.object.name;
            nicorepoObject_template.querySelector("#nicorepoObject-thumbnail").src = object.object.image;


            
    
            nicorepoObject_template.querySelector("#nicorepoObject-url").addEventListener("click", event => {
                if (options.wayOpenVideo.value === "currentTab") {
                    chrome.tabs.query({ active: true, currentWindow: true, lastFocusedWindow: true }, tab => {
                        chrome.tabs.update(tab[0].id, { url: nicorepoObject_template.querySelector("#nicorepoObject-url").href })
                    })
    
                    event.preventDefault();
                }
            })
    
            this.nicorepoObjectList.append(nicorepoObject_template);
        }
    
        if (result.meta.hasNext) nicorepo_more.classList.remove("d-none");
        else nicorepo_more.classList.add("d-none");
    }

    updated_date_convert(date) {
        const now = new Date();
        const start = new Date(date);

        const time = Math.floor((now - start) / (60 * 60 * 1000));

        if (time < 24) {
            return time;
        } else {
            const formated = new Intl.DateTimeFormat("default", {
                dateStyle: "medium",
                timeStyle: "short",
            }).format(start);

            return formated;
        }
    }
}

const storage = new localStorage();
let previewMylist;
let nicorepo = new NicoRepo();

window.addEventListener('DOMContentLoaded', setTheme);
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", setTheme);

mylistSelect.addEventListener("click", async e => {
    for (let i = 0; i < mylistSelect.children.length; i++) {
        mylistSelect.children[i].classList.remove("active");
    }

    e.target.classList.add("active");

    await storage.set();

    previewMylistObject_firstPage(e.target.dataset.id, e.target.dataset.name);
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

options.addEventListener("change", () => {
    storage.set();
    setTheme();
});

(async () => {
    try {
        await checkUserSession();
        await getMylist();

        const item = await storage.get();
        storage.restore(item);

        countMemoLength();

        nicorepo.append_nicorepo(await nicorepo.get_nicorepo());
    } catch (error) {
        console.log(error);
    }

})();

async function checkUserSession() {
    const user_session = await chrome.cookies.get({ url: 'https://www.nicovideo.jp/', name: 'user_session' });

    if (user_session != null) return;

    showToast("マイリストの取得に失敗しました。ログインしてから再度開いてください", false);
    throw new Error("checkUserSession-user_session-null");
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

    storage.set();

    if (count === 256) memoLength.style.color = "red";
    else memoLength.style.color = "";
}

function showToast(message, autohide) {
    const toastContainer = document.getElementsByClassName("toast-container")[0];
    const toast_base = document.getElementsByClassName("toast")[0];
    const toast_template = toast_base.cloneNode(true);

    toast_template.getElementsByClassName("toast-body")[0].innerText = message;
    const toast = new bootstrap.Toast(toast_template, { "autohide": autohide, "delay": 3000 });

    toastContainer.append(toast_template);
    toast.show();
}

async function setTheme() {
    const item = await storage.get("nvocm_theme");

    if (item.nvocm_theme === undefined && window.matchMedia("(prefers-color-scheme: dark)").matches || item.nvocm_theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.setAttribute("data-bs-theme", "dark");
    } else {
        document.documentElement.setAttribute("data-bs-theme", item.nvocm_theme);
    }
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

nicorepo_reload.addEventListener("click", async () => {
    nicorepo = new NicoRepo();
    let result = await nicorepo.get_nicorepo();

    nicorepo.append_nicorepo(result);
})

nicorepo_more.addEventListener("click", async () => {
    let result = await nicorepo.get_nicorepo();

    nicorepo.append_nicorepo(result);
})