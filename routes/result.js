var express = require('express');
var router = express.Router();
var votemanager = require('../managers/votemanager');
var settings = require('../managers/settings');

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
  if(active != undefined){
    active.options = shuffle(active.options);
    res.render('result', { vote: active, activeId: active.id, realsettings:JSON.stringify(settings.get()) });
  }
  else{
    res.render('result', {realsettings:JSON.stringify(settings.get())});
  }
});

module.exports = router;
