function getStorageMylist(){
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('nvocm', (value) => {
            resolve(value.nvocm);
        });
    })
}

function setStatus(action){
    if (action == "select"){
        let selectedText = $("select option:selected").text();
        $('#mylist_setting_status').text("選択中：" + selectedText);
    } else if (action == "save"){
        $('#mylist_setting_status').text("保存しました");
    }
}

function setStorageMylist(){
    var id = $('select').val();
    chrome.storage.local.set({nvocm: id}, () => {
        var index = $('select').prop('selectedIndex');
        chrome.browserAction.setBadgeText({'text': String(index + 1)}, () => {});
        setStatus("save");
    });
}

function setMylist(json, restoreId){
    for (let i = 0; i < json.length; i++) {
        if (restoreId !== undefined && restoreId == json[i].id){
            $('select').append(`<option selected value=${json[i].id}>${json[i].name}</option>`);
            setStatus("select");
        } else {
            $('select').append(`<option value=${json[i].id}>${json[i].name}</option>`);
        }
    }
}

function changeTab(link){
    $('.controlTab').each(function (){
        let val = $(this).attr('href');
        
        if (val == link){
            $(this).attr('id', 'selectedTab');
            $(val).css('display', 'block');
        } else {
            $(this).removeAttr('id');
            $(val).css('display', 'none');
        }
    });
}

$(window).on('load',function(){
    chrome.runtime.sendMessage({ message: "mylist" }, (response) => {
        getStorageMylist().then((value) => {
            setMylist(response.data, value);
        })
    });
    $('#save').bind('click',setStorageMylist);
    $('select').bind('change', () => {
        setStatus("select");
    });
    $('.controlTab').bind('click', function(){
        let link = $(this).attr('href');
        changeTab(link);
    });
});