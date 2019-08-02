var express = require('express');
var router = express.Router();
var votemanager = require('../managers/votemanager');
var settings = require('../managers/settings');
var uuid = require('uuid/v4');

function shuffle(array) {
  var m = array.length,
    t, i;
  // While there remain elements to shuffle…
  while (m) {
    // Pick a remaining element…
    i = Math.floor(Math.random() * m--);
    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}

/* GET vote page. */
router.get('/', function(req, res, next) {
  var active = votemanager.getActiveVote();
  if(req.cookies.userid == undefined || settings.get().multiplevotes)
    res.cookie("userid", uuid());
  if(active != undefined){
    active.options = shuffle(active.options);
    res.render('vote', { vote: active, alreadyvoted: (!settings.get().multiplevotes && votemanager.hasVoted(req.cookies.userid)) });
  }
  else{
    res.render('vote');
  }
});
router.post('/', function(req,res){
  if(req.body != undefined && req.body.ballot != undefined && req.body.id != undefined && req.cookies.userid != undefined){
    if(votemanager.castBallot(req.body.id, req.body.ballot, req.cookies.userid))
      res.sendStatus(200);
    else
      res.sendStatus(400);
  }
  else{
    res.sendStatus(400);
  }
});

module.exports = router;
