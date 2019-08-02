var committee = { };
var committeeobj = { 
    members:[],
    displayorder:["president", "vice-president", "vice president", "secretary", "treasurer","fundraiser","events co-ordinator","events coordinator","social media officer", "inventory manager","productions manager","productions treasurer"],
    ausaurl: "https://www.ausa.org.uk/societies/society/cinergi/",
    name: ""
};
var srcurl = "https://www.ausa.org.uk";

const request = require('request');
const cheerio = require('cheerio');
const _ = require("underscore");

committee.load = async function(){
    var savedcommitteeobj = await persist.getItem('committee');
    if(savedcommitteeobj!=undefined){
        committeeobj = savedcommitteeobj;
    }
}
committee.get = function(){
    return committeeobj;
}

function newMember(position, name, imageurl){
    if(imageurl){
        imageurl = srcurl + imageurl.substring(0, imageurl.indexOf("?"));
    }
    committeeobj.members.push({position:position, name:name, imageurl:imageurl});
}

committee.update = async function(scrapeurl, name, resolve){
    committeeobj.srcurl=scrapeurl;
    committeeobj.name=name;

    request.get(scrapeurl, async function (error, response, body){
        if(error){
            resolve(undefined);
        }
        else{
            committeeobj.members = [] //reset the old committee member list
            var $ = cheerio.load(body);
            var currentpositionname = "";
            $(".msl-groupedmemberlist").children().each(function(index,groupelement){
                var tagname = groupelement.tagName.toLowerCase();
                if(tagname=="h4"){
                    //Committee title
                    currentpositionname = $(groupelement).text();
                }
                else if(tagname=="ul"){
                    $(groupelement).find(".badge").each(function(index2,listelement){
                        listelement = $(listelement);
                        newMember(currentpositionname, listelement.find("dt").text(), listelement.find(".badge_avatar").prop("src"));
                    });
                }
            });
        }
        var sorted = _.sortBy(committeeobj.members, function(x) {
            return _.indexOf(committeeobj.displayorder, x.position.toLowerCase());
        })
        committeeobj.members = sorted;
        await persist.setItem('committee', committeeobj);
        console.log(committeeobj);
        resolve(committeeobj);
    });
}

module.exports = committee;