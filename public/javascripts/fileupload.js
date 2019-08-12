var sessionID = "";
var uploadedFiles = [];
var initialFileSession = true;
function randomId(){
    var timestamp = Date.now().toString();
    var random = Math.floor(Math.random() * 10000).toString();
    return timestamp+random;
}
function newFileSession(){
    if(!initialFileSession){
        $.post('/admin/filemanager/remove/'+sessionID);
    }
    sessionID = randomId();
    uploadedFiles = [];
    initialFileSession=false;
}
newFileSession();

function getUploadedFiles(){
    var uploadedFiles = [];
    $(".uploadedFile").each(function(){
        var upload = $(this);
        uploadedFiles.push(
            { name:upload.attr("data-uploadname"), 
              extension:upload.attr("data-extension"), 
              type: upload.attr("data-type"),
              caption: upload.find(".uploaded-caption").val(),
            })
    });
    return uploadedFiles;
}
function getSessionId(){
    return sessionID;
}
function openFile(btn){
    $(btn).siblings("input").click();
}
function choseFile(input, listSelector, singleselection, type){
    if(singleselection && $(listSelector).children().length>0){
        var toremove = $(listSelector).children()[0].getAttribute("data-uploadname");
        cancelFile(toremove, function(){
            choseFileContinue(input, listSelector, type);
        })
    }
    else{
        choseFileContinue(input, listSelector, type);
    }
}
function choseFileContinue(input, listSelector, type){
    var file = input.files[0];
    if(file.size > 5*1024*1024) {
        alert('Error : Exceeded size 5MB');
        return;
    }
    var urlappend = "";
    if(type=="poster") urlappend="?thumbwidth=400";
    if(type=="hero") urlappend="?thumbwidth=350";
    if(type=="btspic") urlappend="?thumbwidth=200";
    var formData = new FormData();
    formData.append('file', file);
    var xhr = new XMLHttpRequest();
    var loadid = randomId();
    appendLoadUi(listSelector, loadid, file.name)
    xhr.responseType="json";
    xhr.addEventListener('load', function(e) {
        appendFileUi(listSelector, xhr.response.name, `/temp/${sessionID}/${xhr.response.name}_thumb.${xhr.response.extension}`, type, xhr.response.extension, "",loadid);
        uploadedFiles.push({name:xhr.response.name, extension:xhr.response.extension, type:type});
    });
    xhr.upload.addEventListener('progress', function(e) {
        var percent_complete = (e.loaded / e.total)*100;
        $(`#${loadid} .fileupload-percent`).text(Math.floor(percent_complete)+"%");
        $(`#${loadid} .fileupload-progressbar`).stop().animate({width:percent_complete+"%"});
    });
    xhr.open('POST', '/admin/filemanager/upload/'+sessionID+urlappend, true);
    xhr.send(formData);
}
function appendLoadUi(listSelector, id, filename){
    $(listSelector).append(`
        <div id="${id}" class="uploadingFile" style="height: 64px;position: relative;margin-bottom:4px;width:100%;padding:12px;box-sizing:border-box;">
            <strong>Uploading ${filename}...</strong>
            <div class="fileupload-percent">0%</div>
            <div style="width:100%;height:2px;background-color:rgba(0,0,0,0.1);position:relative;">
                <div class="fileupload-progressbar" style="position:absolute;height:2px;background-color:rgba(5,24,117,1);">
            </div>
        </div>`)
        $(listSelector).sortable({animation:150, axis:'y'});
}
function appendFileUi(listSelector, fileid, thumburl, type, extension, caption, loadid){
    var captionvalue = "";
    if(caption) captionvalue=`value="${caption}"`;
    var nodeHtml = `
    <div class="uploadedFile" style="height: 64px;position: relative;margin-bottom:4px;" data-uploadname="${fileid}" data-extension="${extension}" data-type="${type}">
        <img class="uploaded-thumb" src="${thumburl}" style="width:64px;height:64px;position:absolute;object-fit:cover;">
        <div style="width: calc(100% - 72px);position: absolute;left: 72px;">
            <input class="uploaded-caption" type="text" style="padding:6px;font-size:12px;margin-top:4px;" placeholder="Caption" ${captionvalue}>
            <button class="smallbtn" style="font-size:11px;margin-top:0px;display:inline-block;" onclick="cancelFile('${fileid}')">REMOVE FILE</button>
            <i class="move fas fa-arrows-alt"></i>
        </div>
    </div>`
    var loadui=document.getElementById(loadid);
    if(loadui){
        $(loadui).replaceWith(nodeHtml)
    }
    else{
        $(listSelector).append(nodeHtml)
    }
    $(listSelector).sortable({animation:150, axis:'y'});
}
function uploadFile(file){
    var formData = new FormData();
    formData.append('file', file);
    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/admin/filemanager/upload/'+sessionID, true);
    xhr.send(formData);
}
function cancelFile(id, callback){
    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/admin/filemanager/remove/'+sessionID+'/'+id, true);
    xhr.send();
    xhr.addEventListener('load', function(e){
        $(`[data-uploadname='${id}'`).remove();
        if(callback) callback();
    });
}

window.addEventListener('unload', function(){
    this.navigator.sendBeacon('/admin/filemanager/remove/'+sessionID);
})