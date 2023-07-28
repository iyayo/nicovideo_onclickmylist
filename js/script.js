let checkMylist_status = false;
const observer = new MutationObserver(checkMylist);
const target = document.querySelector("title");
const config = { childList: true };

observer.observe(target, config);

let name = "ワンクリックマイリスト";

    const parentNode = document.querySelector(".VideoMenuContainer-areaLeft");
    const referenceNode = document.querySelector("section.VideoMenuLikeFieldContainer").nextSibling;
    const div = document.createElement("div");
    div.className = "ClickInterceptor LoginRequirer is-inline";

    const button = document.createElement("button");
    button.id = "onclick_mylist";
    button.className = "ActionButton WatchLaterButton VideoMenuContainer-button";
    button.dataset.title = name;
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!-- Font Awesome Pro 5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) --><path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm144 276c0 6.6-5.4 12-12 12h-92v92c0 6.6-5.4 12-12 12h-56c-6.6 0-12-5.4-12-12v-92h-92c-6.6 0-12-5.4-12-12v-56c0-6.6 5.4-12 12-12h92v-92c0-6.6 5.4-12 12-12h56c6.6 0 12 5.4 12 12v92h92c6.6 0 12 5.4 12 12v56z"/></svg>`;

    parentNode.insertBefore(div, referenceNode);
    div.appendChild(button);

chrome.storage.local.get(["nvocm_name"], item => {
    if (item.nvocm_name !== undefined) {
        name = item.nvocm_name;
        button.dataset.title = item.nvocm_name;

        checkMylist();
    }
})

chrome.storage.local.onChanged.addListener(item => {
    if (item.nvocm_name) {
        name = item.nvocm_name.newValue;
        button.dataset.title = item.nvocm_name.newValue;

        checkMylist();
    }
})

button.addEventListener("click", addMylist);

function resetDataTitle() {
    button.classList.remove("is-succeeded", "is-failed");
    button.dataset.title = name;
}

function addMylist() {
    if (!checkMylist_status) {
        chrome.runtime.sendMessage({ message: "addMylist" }, (response) => {
            if (response === "あとで見るに登録しました" || response === "マイリストに登録しました") button.classList.add("is-succeeded");
            else button.classList.add("is-failed");

            checkMylist();
            button.dataset.title = response;
            timeoutID = window.setTimeout(resetDataTitle, 5000);
        });
    } else {
        chrome.runtime.sendMessage({ message: "deleteMylist" }, (response) => {
            if (response === "あとで見るに登録しました" || response === "マイリストから削除しました") button.classList.add("is-succeeded");
            else button.classList.add("is-failed");

            checkMylist();
            button.dataset.title = response;
            timeoutID = window.setTimeout(resetDataTitle, 5000);
        });
    }
}

function checkMylist() {
    chrome.runtime.sendMessage({ message: "checkMylist" }, (response) => {
        if (response) {
            button.style.fill = "#007cff";
            button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!-- Font Awesome Pro 5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) --><path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z"/></svg>`;
        } else {
            button.style.fill = null;
            button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!-- Font Awesome Pro 5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) --><path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm144 276c0 6.6-5.4 12-12 12h-92v92c0 6.6-5.4 12-12 12h-56c-6.6 0-12-5.4-12-12v-92h-92c-6.6 0-12-5.4-12-12v-56c0-6.6 5.4-12 12-12h92v-92c0-6.6 5.4-12 12-12h56c6.6 0 12 5.4 12 12v92h92c6.6 0 12 5.4 12 12v56z"/></svg>`;
        }

        checkMylist_status = response;
    });
}