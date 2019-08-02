var breakingnews={};

var breakingnewsObject={
    title:"",
    subtitle:"",
    url:"",
    start:0,
    end:0
};
breakingnews.load = async function(){
    var savedbn = await persist.getItem('breakingnews');
    if(savedbn!=undefined){
        breakingnewsObject=savedbn;
    }
}


breakingnews.set = async function(title, subtitle, url, start, end){
    breakingnewsObject.title = title;
    breakingnewsObject.subtitle = subtitle;
    breakingnewsObject.url = url;
    breakingnewsObject.start = start;
    breakingnewsObject.end = end;
    await persist.setItem('breakingnews', breakingnewsObject);
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