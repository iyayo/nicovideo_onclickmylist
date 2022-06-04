window.onload = function () {
    let name = "ワンクリックマイリスト";

    const parentNode = document.querySelector(".VideoMenuContainer-areaLeft");
    const referenceNode = document.querySelector("section.VideoMenuLikeFieldContainer").nextSibling;
    const div = document.createElement("div");
    div.className = "ClickInterceptor LoginRequirer is-inline";

    const button = document.createElement("button");
    button.id = "onclick_mylist";
    button.className = "ActionButton WatchLaterButton VideoMenuContainer-button";
    button.dataset.title = name;
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 13h-5v5h-2v-5h-5v-2h5v-5h2v5h5v2z"/></svg>`;

    parentNode.insertBefore(div, referenceNode);
    div.appendChild(button);

    chrome.storage.local.get(["nvocm_name"], item => {
        if (item.nvocm_name !== undefined) {
            name = item.nvocm_name;
            button.dataset.title = item.nvocm_name;
        }
    })

    chrome.storage.local.onChanged.addListener(item => {
        if (item.nvocm_name) {
            name = item.nvocm_name.newValue;
            button.dataset.title = item.nvocm_name.newValue;
        }
    })

    button.addEventListener("click", addMylist);

    function resetDataTitle() {
        button.classList.remove("is-succeeded", "is-failed");
        button.dataset.title = name;
    }

    function addMylist() {
        chrome.runtime.sendMessage({ message: "addMylist" }, (response) => {
            if (response === "あとで見るに登録しました" || response === "マイリストに登録しました") button.classList.add("is-succeeded");
            else button.classList.add("is-failed");

            button.dataset.title = response;
            timeoutID = window.setTimeout(resetDataTitle, 5000);
        });
    }
}