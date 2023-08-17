let checkMylist_status = false;
const observer = new MutationObserver(checkMylist);
const target = document.querySelector("title");
const config = { childList: true };

observer.observe(target, config);

const VideoMenu_button = document.createElement("button");
VideoMenu_button.id = "VideoMenu_button";
VideoMenu_button.className = "ActionButton WatchLaterButton VideoMenuContainer-button";

const Controller_button = document.createElement("button");
Controller_button.id = "Controller_button";
Controller_button.className = "ActionButton ControllerButton WatchLaterButton";

VideoMenu_button.innerHTML = Controller_button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!-- Font Awesome Pro 5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) --><path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm144 276c0 6.6-5.4 12-12 12h-92v92c0 6.6-5.4 12-12 12h-56c-6.6 0-12-5.4-12-12v-92h-92c-6.6 0-12-5.4-12-12v-56c0-6.6 5.4-12 12-12h92v-92c0-6.6 5.4-12 12-12h56c6.6 0 12 5.4 12 12v92h92c6.6 0 12 5.4 12 12v56z"/></svg>`;

let mylist_name = VideoMenu_button.dataset.title = Controller_button.dataset.title = "ワンクリックマイリスト";

const interval = setInterval(() => {
    const parentNode = document.querySelector(".VideoMenuContainer-areaLeft");
    const referenceNode = document.querySelector("section.VideoMenuLikeFieldContainer").nextSibling;
    const parentNode2 = document.querySelector(".ControllerContainer-area:last-of-type");
    const referenceNode2 = document.querySelector(".PlaybackRateButton");

    if (!parentNode || !referenceNode || !parentNode2 || !referenceNode2) return;

    const div = document.createElement("div");
    div.className = "ClickInterceptor LoginRequirer is-inline";

    parentNode.insertBefore(div, referenceNode);
    div.appendChild(VideoMenu_button);

    parentNode2.insertBefore(Controller_button, referenceNode2);

    clearInterval(interval);
}, 100);

chrome.storage.local.get(["nvocm_name"], item => {
    if (item.nvocm_name === undefined) return;

    mylist_name = VideoMenu_button.dataset.title = Controller_button.dataset.title = item.nvocm_name;

    checkMylist();
})

chrome.storage.local.onChanged.addListener(item => {
    if (!item.nvocm_name) return;

    mylist_name = VideoMenu_button.dataset.title = Controller_button.dataset.title = item.nvocm_name.newValue;

    checkMylist();
})

VideoMenu_button.addEventListener("click", addMylist);
Controller_button.addEventListener("click", addMylist);

function resetDataTitle(element) {
    element.classList.remove("is-succeeded", "is-failed");
    element.dataset.title = mylist_name;
}

function addMylist() {
    if (!checkMylist_status) {
        chrome.runtime.sendMessage({ message: "addMylist" }, (response) => {
            if (response === "あとで見るに登録しました" || response === "マイリストに登録しました") this.classList.add("is-succeeded");
            else this.classList.add("is-failed");

            checkMylist();
            this.dataset.title = response;
            timeoutID = window.setTimeout(resetDataTitle, 5000, this);
        });
    } else {
        chrome.runtime.sendMessage({ message: "deleteMylist" }, (response) => {
            if (response === "あとで見るに登録しました" || response === "マイリストから削除しました") this.classList.add("is-succeeded");
            else this.classList.add("is-failed");

            checkMylist();
            this.dataset.title = response;
            timeoutID = window.setTimeout(resetDataTitle, 5000, this);
        });
    }
}

function checkMylist() {
    chrome.runtime.sendMessage({ message: "checkMylist" }, (response) => {
        if (response) {
            VideoMenu_button.innerHTML = Controller_button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!-- Font Awesome Pro 5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) --><path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z"/></svg>`;
            VideoMenu_button.style.fill = Controller_button.children[0].style.fill = "#007cff";
        } else {
            VideoMenu_button.innerHTML = Controller_button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!-- Font Awesome Pro 5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) --><path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm144 276c0 6.6-5.4 12-12 12h-92v92c0 6.6-5.4 12-12 12h-56c-6.6 0-12-5.4-12-12v-92h-92c-6.6 0-12-5.4-12-12v-56c0-6.6 5.4-12 12-12h92v-92c0-6.6 5.4-12 12-12h56c6.6 0 12 5.4 12 12v92h92c6.6 0 12 5.4 12 12v56z"/></svg>`;
            VideoMenu_button.style.fill = Controller_button.children[0].style.fill = null;
        }

        checkMylist_status = response;
    });
}