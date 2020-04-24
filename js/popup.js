function getStorageMylist(){
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([
            'nvocm_id',
            'nvocm_desc',
            'nvocm_autoClose',
            'nvocm_selectSize',
            'nvocm_notificationSound'
        ], (value) => {
            resolve(value);
        });
    })
}

function setStatus(action){
    if (action == "select"){
        let selectedText = $("select option:selected").text();
        let selectedVal = $("select option:selected").val()
        $('#mylist_setting_status span').text("選択中：");
        $('#mylist_setting_status a').text(selectedText);
        $('#mylist_setting_status a').attr({
            'href': 'https://www.nicovideo.jp/my/mylist/#/' + selectedVal,
            'target': '_blank',
            'title': selectedText
        });
    } else if (action == "save"){
        $('#mylist_setting_status span').text("ステータス：");
        $('#mylist_setting_status a').text("保存しました");
        $('#mylist_setting_status a').removeAttr('href target title');
    }
}

function setStorageMylist(autoClose){
    let id = $('select').val();
    let desc = $('textarea').val();
    chrome.storage.local.set({
        nvocm_id: id,
        nvocm_desc: desc
    }, () => {
        var index = $('select').prop('selectedIndex');
        chrome.browserAction.setBadgeText({'text': String(index + 1)}, () => {});
        setStatus("save");

        if (autoClose == true){
            window.close();
        }
    });
}

function setMylist(json, restoreId, restoreDesc){
    for (let i = 0; i < json.length; i++) {
        if (restoreId !== undefined && restoreId == json[i].id){
            $('select').append(`<option selected value=${json[i].id}>${json[i].name}</option>`);
            setStatus("select");
        } else {
            $('select').append(`<option value=${json[i].id}>${json[i].name}</option>`);
        }
    }
    $('textarea').val(restoreDesc);
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

function setStorageOption(){
    chrome.storage.local.set({
        nvocm_autoClose: $('#autoClose').prop('checked'),
        nvocm_selectSize: $('#selectSize').val(),
        nvocm_notificationSound: $('#notificationSound').prop('checked')
    }, () => {
        $('select').attr('size', $('#selectSize').val());
    });
}

function restoreOption(){
    getStorageMylist().then((value) => {
        $('#autoClose').prop('checked', value.nvocm_autoClose);
        $('#notificationSound').prop('checked', value.nvocm_notificationSound);
        if (value.nvocm_selectSize != undefined){
            $('#selectSize').val(value.nvocm_selectSize);
            $('select').attr('size', value.nvocm_selectSize);
        }
    });
}

$(window).on('load',function(){
    restoreOption();
    chrome.runtime.sendMessage({ message: "mylist" }, (response) => {
        getStorageMylist().then((value) => {
            setMylist(response.data, value.nvocm_id, value.nvocm_desc);
        });
    });
    $('#save').bind('click', () => {
        getStorageMylist().then((value) => {
            setStorageMylist(value.nvocm_autoClose);
        });
    });
    $('select').bind('change', () => {
        setStatus("select");
    });
    $('.controlTab').bind('click', function(){
        let link = $(this).attr('href');
        changeTab(link);
    });
    $('.option').bind('change',setStorageOption);
});