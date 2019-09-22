var votemanager ={};
var storage = require('./storage');
var settings = require('./settings');
var voteList = new Map([]);
var voteResult = new Map([])
var hasVoted = [];
var armedVoteId;
var activeVoteId;

function maptoarray(map){
    var output = [];
    map.forEach(function(value,key,map){
        output.push([key,value]);
    });
    return output;
}
function arraytomap(array){
    var output = new Map([]);
    array.forEach(value =>{
        output.set(value[0], value[1])
    })
    return output;
}

votemanager.initdb = async function(){
    storage.load('votelist', [], function(newobj){
        persistentList=newobj;
        if(persistentList!=undefined)
            voteList = new Map(arraytomap(persistentList));
    });
}
votemanager.savedb = async function(){
    var ting = maptoarray(voteList);
    storage.save('votelist', ting);
}
//var app = require("./app");

/**
 * Cast a ballot in the active vote
 * @param {number} voteId The vote id
 * @param {*} ballot A string (fpp) or array (ranked)
 * @param {*} userId The user id
 */
votemanager.castBallot = function(voteId, ballot, userId){
    if(voteId == activeVoteId && hasVoted.indexOf(userId)==-1){
        var vote = voteList.get(voteId);
        var returnvalue = false;
        if(vote.type == "fpp"){
            returnvalue= castFppBallot(ballot, userId);
        }
        else if(vote.type == "rank"){
            returnvalue= castRankBallot(ballot, userId);
        }
        return returnvalue;
    }
    else{
        return false;
    }
}
function castFppBallot(optionTitle, userId){
    var option = voteResult.get(optionTitle);
    if(option != undefined){
        voteResult.set(optionTitle, option+1);
        hasVoted.push(userId);
        io.emit("vote.result.update", voteList.get(activeVoteId), maptoarray(voteResult), hasVoted.length);
        return true;
    }
    else{
        return false;
    }
}
function castRankBallot(rankedOptions, userId){
    var zeroforlast = settings.get().zeroforlast;
    singleuserResult = new Map([]);
    var activevote = votemanager.getActiveVote();
    for(let index = 0; index < activevote.options.length; index++){
        var userindex = rankedOptions.indexOf(activevote.options[index].title);
        if(userindex==-1){
            //not voted for
            userindex=activevote.options.length-1;
            if(zeroforlast){
                continue;
            }
        }
        var oldoptionscore = voteResult.get(activevote.options[index].title);
        if(oldoptionscore==undefined)oldoptionscore=0;

        var newoptionscore = oldoptionscore+((activevote.options.length-userindex)/activevote.options.length);
        console.log("new score="+newoptionscore);
        voteResult.set(activevote.options[index].title, newoptionscore);
    }
    hasVoted.push(userId);
    io.emit("vote.result.update", voteList.get(activeVoteId), maptoarray(voteResult), hasVoted.length);
    return true;
}


/**
 * Add a vote object to the list of current votes
 * @param {string} title The title of the vote
 * @param {string} subtitle The subtitle of the vote
 * @param {option[]} options The possible voting options
 * @param {string} type The type of vote: 'fpp' (first past the post) or 'rank'
 * @param {string} operation 'start' or 'arm'
 * @returns {number} The timestamp ID of the created vote
 */
votemanager.createVote = function(title, subtitle, options, type, operation){
    var id = Date.now();
    var vote = {title:title, subtitle:subtitle, options:options, type:type, id:id};
    voteList.set(id,vote);
    io.emit("vote.create",vote);
    if(operation == "start"){
        votemanager.startVote(id);
    }
    else if(operation == "arm"){
        votemanager.armVote(id);
    }
    votemanager.savedb();
    return id;
}
votemanager.createOption = function(title, subtitle, image){
    return {title:title, subtitle:subtitle, image:image};
}

//Show a vote question on the results page
votemanager.armVote = function(timestampId){
    var vote = voteList.get(timestampId);
    if(vote==undefined) {
        return false;
    }
    else{
        armedVoteId = timestampId;
        io.emit("vote.arm.start",vote);
        return true;
    }
}

votemanager.unarmVote = function(timestampId){
    var vote = voteList.get(timestampId);
    if(vote==undefined) {
        return false;
    }
    else{
        armedVoteId = timestampId;
        io.emit("vote.arm.stop",timestampId);
        return true;
    }
}


/** Start the specified vote */
votemanager.startVote = function(timestampId){
    var vote = voteList.get(timestampId);
    if(vote==undefined) {
        return false;
    }
    else{
        activeVoteId = timestampId;
        voteResult = new Map([]);
        hasVoted = [];
        vote.options.forEach((option)=>{
            voteResult.set(option.title, 0);
        })
        io.emit("vote.start",vote);
        return true;
    }
}

/** Stop the specified vote */
votemanager.stopVote = function(timestampId){
    var vote = voteList.get(timestampId);
    if(vote){
        if(timestampId == activeVoteId){
            activeVoteId = undefined;
            vote.results = voteResult;
            io.emit("vote.stop",timestampId);
        }
    }
    //Push the update to the websocket
}
votemanager.finishVote = function(timestampId){
    var vote = voteList.get(timestampId);
    if(vote){
        if(timestampId == activeVoteId){
            vote.results = voteResult;
            io.emit("vote.stop",timestampId);
        }
    }
    //Push the update to the websocket
}
votemanager.removeVote = function(timestampId){
    if(activeVoteId == timestampId) return false;
    voteList.delete(timestampId);
    votemanager.savedb();
    io.emit("vote.delete",timestampId);
    return true;
}
votemanager.getVotes = function(){
    if(voteList instanceof Map)
        return voteList;
    else 
        return undefined;
}
votemanager.getActiveId = function(){
    return activeVoteId;
}
votemanager.getArmedId = function(){
    return armedVoteId;
}
votemanager.getActiveVote = function(){
    if(activeVoteId==undefined) return undefined;
    return voteList.get(activeVoteId);
}
votemanager.getVote = function(id){
    return voteList.get(id);
}
votemanager.hasVoted = function(id){
    if(id == undefined) return false;
    return (hasVoted.indexOf(id) != -1)
}
votemanager.tryForceResultUpdate = function(client){
    if(activeVoteId!=undefined){
        client.emit("vote.start",voteList.get(activeVoteId));
        client.emit("vote.result.update", voteList.get(activeVoteId), maptoarray(voteResult), hasVoted.length);
    }
}

module.exports = votemanager;