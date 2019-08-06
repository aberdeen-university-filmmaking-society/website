var breakingnews={};
var storage = require('./storage');
var breakingnewsObject={
    title:"",
    subtitle:"",
    url:"",
    start:0,
    end:0
};
breakingnews.load = async function(){
    storage.load("breakingnews", breakingnewsObject, function(newobj){
        breakingnewsObject=newobj;
    });
}

breakingnews.set = async function(title, subtitle, url, start, end){
    breakingnewsObject.title = title;
    breakingnewsObject.subtitle = subtitle;
    breakingnewsObject.url = url;
    breakingnewsObject.start = start;
    breakingnewsObject.end = end;

    storage.save("breakingnews", settingsobj);
}
breakingnews.get = function(){
    return breakingnewsObject;
}
breakingnews.now = function(){
    var startTS = new Date(breakingnewsObject.start).getTime();
    var endTS = new Date(breakingnewsObject.end).getTime();
    var nowTS = Date.now();

    if(startTS>nowTS || endTS<nowTS) //start is in the future or end is in the past
        return false;
    else
        return true;
}

module.exports = breakingnews;