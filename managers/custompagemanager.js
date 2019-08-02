var custompagemanager={};
custompagemanager.pages={
    faq:' ',
    headerinsert:' ',
    cssmods:' ',
    homepageinsert:' '
};
var acceptedids = ["faq","headerinsert","cssmods","homepageinsert"]
custompagemanager.hints={
    faq:'Questions/Answers are in HTML. Make sure <a href="https://www.freeformatter.com/html-escape.html">special characters are escaped!</a>',
    headerinsert:'This HTML is inserted below the logo in the header.',
    cssmods:'This HTML is inserted at the top of every page, above the header.<br>Enclose all your custom css in a &lt;style&gt; tag, it will apply to the entire website (excluding voting pages).<b>Temporary CSS modifications ONLY</b>',
    homepageinsert:'This HTML is inserted at the top of the home page, before the hero post'
}

custompagemanager.haspage = function(id){
    if(acceptedids.indexOf(id)==-1) return false;
    else return true;
}

custompagemanager.load = async function(){
    var savedpages = await persist.getItem('custompages');
    for (var property in custompagemanager.pages) {
        if (!savedpages.hasOwnProperty(property)) {
          savedpages[property] = custompagemanager.pages[property];
        }
      }
    if(savedpages!=undefined){
        custompagemanager.pages=savedpages;
    }
}
custompagemanager.set = async function(name, body){
    custompagemanager.pages[name] = body;
    await persist.setItem('custompages', custompagemanager.pages);
}

module.exports = custompagemanager;