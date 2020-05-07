window.onload = function() {
    let insertion = document.querySelector('.VideoMenuContainer-areaLeft');
    let div = document.createElement('div');
    div.className = 'ClickInterceptor LoginRequirer is-inline';

    let button = document.createElement('button');
    button.id = 'onclick_mylist';
    button.className = 'ActionButton InstantMylistButton VideoMenuContainer-button';
    button.dataset.title = 'ワンクリックマイリスト';
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 13h-5v5h-2v-5h-5v-2h5v-5h2v5h5v2z"/></svg>`;

    insertion.prepend(div);
    div.appendChild(button);

    button.onclick = (() => {
        chrome.runtime.sendMessage({ message: 'click' }, (response) => {
            if (response.status == 'マイリストに登録しました'){
                button.classList.add('is-succeeded');
            } else {
                button.classList.add('is-failed');
            }
            button.dataset.title = response.status;
            timeoutID = window.setTimeout(resetDataTitle, 5000, button);
        });
    });
}

function resetDataTitle(element){
    element.classList.remove('is-succeeded', 'is-failed');
    element.dataset.title = 'ワンクリックマイリスト';
}