function getStorageMylist(){
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('nvocm', (value) => {
            resolve(value.nvocm);
        });
    })
}

function setStorageMylist(){
    var id = $('select').val();
    chrome.storage.local.set({nvocm: id}, () => {
        var index = $('select').prop('selectedIndex');
        chrome.browserAction.setBadgeText({'text': String(index + 1)}, () => {});
        $('.save_alert').show();
        $('.save_alert').fadeOut(3000);
    });
}

function setMylist(json, restoreId){
    for (let i = 0; i < json.length; i++) {
        if (restoreId !== undefined && restoreId == json[i].id){
            $('select').append(`<option selected value=${json[i].id}>${json[i].name}</option>`);
        } else {
            $('select').append(`<option value=${json[i].id}>${json[i].name}</option>`);
        }
    }
}

$(window).on('load',function(){
    chrome.runtime.sendMessage({ message: "mylist" }, (response) => {
        getStorageMylist().then((value) => {
            setMylist(response.data, value);
        })
    });
    $('#save').bind('click',setStorageMylist);
});