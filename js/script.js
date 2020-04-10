function resetDataTitle(){
    $(".onclick_mylist").attr("data-title", "ワンクリックマイリスト");
}

$(window).on('load',function(){
    $('.VideoMenuContainer-areaLeft').append('<button class="onclick_mylist" data-title="ワンクリックマイリスト" type="button"><svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3zM12 8v8m-4-4h8"></path></svg></button>');
    $(".onclick_mylist").click(function () {
        chrome.runtime.sendMessage({ message: "click" }, function (response) {
            console.log(response.status);
            $(".onclick_mylist").attr("data-title", response.status);
            timeoutID = window.setTimeout(resetDataTitle, 5000);
        });
    });
});