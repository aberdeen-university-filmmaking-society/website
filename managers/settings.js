var settings={};
var settingsobj={
    showresults:false,
    heropost:'',
    homepage_postcount:3,
    homepage_filmcount:10,
    multiplevotes:false,
    votingmusic:0,
    dramaticreveal:false,
    showbreakingnews:true
};

settings.load = async function(){
    var newssettings = await persist.getItem('settings');
    if(newssettings!=undefined){
        settingsobj=newssettings;
    }
}
settings.set = async function(item){
    if(item.key == "heropost" && settingsobj.heropost==item.value){
        settingsobj.heropost = undefined;
    }
    else{
        settingsobj[item.key] = item.value;
    }
    await persist.setItem('settings', settingsobj);
}
settings.get = function(){
    return settingsobj;
}

module.exports = settings;