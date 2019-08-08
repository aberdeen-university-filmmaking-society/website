var aufsproductions={};
var storage = require('./storage');
var productionsPage={
    current:{
        yearname:"",
        filmid:"",
        description:"",
        roadmap:"",
        timeline:[],
        startdate:0,
        monthheight:125
    },
    past:[]
};
aufsproductions.load = async function(){
    storage.load("productionspage", productionsPage, function(newobj){
        productionsPage=newobj;
    });
}
aufsproductions.setCurrentProject = async function(yearname, filmid, description, roadmap, timeline, monthheight, startdate){
    if(!productionsPage.current) productionsPage.current = {};
    productionsPage.current.yearname = yearname;
    productionsPage.current.filmid = filmid;
    productionsPage.current.description = description;
    productionsPage.current.roadmap = roadmap;
    productionsPage.current.timeline = timeline;
    productionsPage.current.startdate = Number.parseInt(startdate);
    if(monthheight<75) monthheight=75;
    if(monthheight>500) monthheight=500;
    productionsPage.current.monthheight = monthheight;
    console.log("SAVED PRODUCTIONS PAGE");
    storage.save("productionspage", productionsPage);
}
aufsproductions.setPastProjects = async function(projects){
    if(projects && projects.length && projects.length>0){
        productionsPage.past = projects;
        console.log("SAVED PRODUCTIONS PAGE:");
        storage.save("productionspage", productionsPage);
    }
}
aufsproductions.get = function(){
    if(productionsPage.current.timeline)
        productionsPage.current.timeline.sort((a, b) => (a.date > b.date) ? 1 : -1);
    return productionsPage;
}
module.exports = aufsproductions;