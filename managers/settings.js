var settings={};
var settingsobj={
    showresults:false,
    heropost:'',
    homepage_postcount:3,
    homepage_filmcount:10,
    multiplevotes:false,
    votingmusic:0,
    dramaticreveal:false,
    showbreakingnews:true,
    zeroforlast:false,
    hideresultorder:false,
    novotetext:"There is currently no active vote"
};
var storage = require('./storage');

settings.load = async function(){
    storage.load("settings", settingsobj, function(newobj){
        settingsobj=newobj;
    });
}
settings.set = async function(item){
    if(item.key == "heropost" && settingsobj.heropost==item.value){
        settingsobj.heropost = undefined;
    }
    else{
        settingsobj[item.key] = item.value;
    }
    storage.save("settings", settingsobj);
}
settings.get = function(){
    return settingsobj;
}

module.exports = settings;