window.onload = function () {
    let name = "ワンクリックマイリスト";
    let mylistId = undefined;

    const parentNode = document.querySelector(".VideoMenuContainer-areaLeft");
    const referenceNode = document.querySelector("span.VideoMenuGiftContainer").nextSibling;
    const div = document.createElement("div");
    div.className = "ClickInterceptor LoginRequirer is-inline";

    const button = document.createElement("button");
    button.id = "onclick_mylist";
    button.className = "ActionButton WatchLaterButton VideoMenuContainer-button";
    button.dataset.title = name;
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 13h-5v5h-2v-5h-5v-2h5v-5h2v5h5v2z"/></svg>`;

    parentNode.insertBefore(div, referenceNode);
    div.appendChild(button);

    chrome.storage.local.get(["nvocm_name", "nvocm_id"], item => {
        if (item.nvocm_name !== undefined) {
            name = item.nvocm_name;
            button.dataset.title = item.nvocm_name;
        }

        if (item.nvocm_id !== undefined) {
            mylistId = item.nvocm_id;
        }
    })

    chrome.storage.local.onChanged.addListener(item => {
        if (item.nvocm_name) {
            name = item.nvocm_name.newValue;
            button.dataset.title = item.nvocm_name.newValue;
        }

        if (item.nvocm_id) {
            mylistId = item.nvocm_id.newValue;
        }
    })

    button.addEventListener("click", () => {
        if (mylistId === undefined) {
            button.classList.add("is-failed");
            button.dataset.title = "登録先が指定されていません";
            timeoutID = window.setTimeout(resetDataTitle, 5000);
            return;
        }
        
        addMylist(mylistId, location.pathname.split("/watch/")[1]);
    });

    function resetDataTitle() {
        button.classList.remove("is-succeeded", "is-failed");
        button.dataset.title = name;
    }

    function addMylist(mylistId, videoId) {
        fetch(`https://nvapi.nicovideo.jp/v1/users/me/mylists/${mylistId}/items?itemId=${videoId}&description=`, {
            "headers": {
                "x-frontend-id": "23",
                "x-request-with": "N-garage"
            },
            "method": "POST",
            "credentials": "include"
        })
        .then(res => {
            if (res.status === 201) {
                button.classList.add("is-succeeded");
                button.dataset.title = "マイリストに登録しました";
            } else if (res.status === 200) {
                button.classList.add("is-failed");
                button.dataset.title = "マイリストに登録済みです";
            } else {
                button.classList.add("is-failed");
                button.dataset.title = "登録に失敗しました";
            }

            timeoutID = window.setTimeout(resetDataTitle, 5000);
        })
    }
}