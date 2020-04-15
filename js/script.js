function resetDataTitle(){
    $(".onclick_mylist").attr("data-title", "ワンクリックマイリスト");
}

$(window).on('load',() => {
    $('.VideoMenuContainer-areaLeft').prepend('<button class="onclick_mylist" data-title="ワンクリックマイリスト" type="button"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-labelledby="title" aria-describedby="desc" role="img" xmlns:xlink="http://www.w3.org/1999/xlink"><title>Num Lock Key</title><desc>A solid styled icon from Orion Icon Library.</desc><path data-name="layer2" d="M54.2 2H9.8A7.8 7.8 0 0 0 2 9.8v44.4A7.8 7.8 0 0 0 9.8 62h44.4a7.8 7.8 0 0 0 7.8-7.8V9.8A7.8 7.8 0 0 0 54.2 2zM48 48H16V16h32z" fill="#333333"></path><path data-name="layer1" d="M27.1 29.7l2.9-2V40a2 2 0 1 0 4 0V20.3l-9.1 6.1a2 2 0 1 0 2.2 3.3z" fill="#333333"></path></svg></button>');
    $(".onclick_mylist").click(() => {
        chrome.runtime.sendMessage({ message: "click" }, (response) => {
            $(".onclick_mylist").attr("data-title", response.status);
            timeoutID = window.setTimeout(resetDataTitle, 5000);
        });
    });
});