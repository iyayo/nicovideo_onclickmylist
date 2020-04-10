function setMylist(json){
    for (let i = 0; i < json.length; i++) {
        $('select').append(`<option value=${json[i].id}>${json[i].name}</option>`);
    }
}

$(window).on('load',function(){
    chrome.runtime.sendMessage({ message: "mylist" }, function (response) {
        setMylist(response.data);
    });
});