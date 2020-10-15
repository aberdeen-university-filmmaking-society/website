var express = require('express');
var router = express.Router();
var votemanager = require('../managers/votemanager');
var postmanager = require('../managers/postmanager');
var filmmanager = require('../managers/filmmanager');
var pagemanger = require('../managers/custompagemanager');
var tagmanager = require('../managers/tagmanager');
var breakingnews = require('../managers/breakingnews');
var productionsmanager = require('../managers/productionsmanager');
var auditionmanager = require('../managers/auditionmanager');
var equipmentmanager = require('../managers/equipmentmanager');

var committee = require('../managers/committee');
var settings = require('../managers/settings');
var passport = require('passport');
var simpleGit = require('simple-git')();
var path = require('path');
votemanager.initdb()



app.get('/auth/unauthorized', function(req,res,next){
  res.status(403).render('error',{ page:'error', error:{status:403}, message:"Forbidden", moreinfo:"Sorry, you can only access the admin panel with the society's Google Account. <a href='/auth/google'>Try again?</a>" });
});
app.get('/auth/google', function(req,res,next){
  const authenticator = passport.authenticate('google',  { scope: ['email'], state: req.query.redirect });
  authenticator(req, res, next)
});

app.get('/auth/callback', 
  passport.authenticate('google', { failureRedirect: '/auth/unauthorized' }),
  function(req, res) {
    // Successful authentication, redirect home.
    if(req.query.state) res.redirect(req.query.state);
    else res.redirect('/admin');
  });
app.get('/auth/signout', function(req,res,next){
  req.logout();
  res.redirect('/');
});
app.all('/admin/*', function(req,res,next){
  if(req.query.key && req.path.startsWith('/admin/auditions/responses')){
    next();
  }
  else if(req.isUnauthenticated()){
    res.redirect('/auth/google?redirect='+encodeURIComponent(req.originalUrl));
  }
  else{
    next();
  }
});

router.post('/vote/create/:op',function(req, res) {
    console.log("creating vote");
    console.log(req.body);
    if(req.body.options == undefined || req.body.title == undefined){
      var messages=[];
      if(req.body.options == undefined) messages.push("options");
      if(req.body.title == undefined) messages.push("title");
      res.status(400).send({errors:messages});
    }
    else{
      var cleanOptions = [];
      req.body.options.forEach(e => {
        cleanOptions.push(votemanager.createOption(e.title,e.subtitle,e.image));
      });
      var id = votemanager.createVote(req.body.title, req.body.subtitle, req.body.options, req.body.type, req.body.operation, req.params.op)
      res.status(200).send({id:id});
    }
  });
router.post('/settings', function(req,res){
  settings.set(req.body);
  io.emit('other.settings.update', settings.get());
  res.sendStatus(200);
});
router.post('/vote/start/:id', function(req,res){
  if(votemanager.startVote(Number(req.params.id)))
    res.sendStatus(200);
  else
    res.sendStatus(400);
});
router.post('/vote/stop/:id', function(req,res){
  if(votemanager.stopVote(Number(req.params.id)))
    res.sendStatus(200);
  else
    res.sendStatus(400);
});
router.post('/vote/show/:id', function(req,res){
  io.emit("vote.result.show", req.params.id);
  if(votemanager.stopVote(Number(req.params.id)))
    res.sendStatus(200);
  else
    res.sendStatus(400);
});
router.post('/vote/arm/:id', function(req,res){
  if(votemanager.armVote(Number(req.params.id)))
    res.sendStatus(200);
  else
    res.sendStatus(400);
});
router.post('/vote/unarm/:id', function(req,res){
  if(votemanager.unarmVote(Number(req.params.id)))
    res.sendStatus(200);
  else
    res.sendStatus(400);
});
router.post('/vote/remove/:id', function(req,res){
  if(votemanager.removeVote(Number(req.params.id)))
    res.sendStatus(200);
  else
    res.sendStatus(400);
});
router.post('/vote/archive/:id', function(req,res){
  if(votemanager.archiveVote(Number(req.params.id)))
    res.sendStatus(200);
  else
    res.sendStatus(400);
});
router.get('/vote/get/:id', function(req,res){
  res.status(200).send(votemanager.getVote(Number(req.params.id)));
});

router.post('/posts/create',function(req, res) {
  console.log("creating post");
  console.log(req.body);
  var result = postmanager.create(req.body, function(success){
    if(success) res.sendStatus(200);
    else res.sendStatus(500);
  });
});
router.post('/posts/remove/:id',function(req, res) {
  postmanager.remove(req.params.id, function(success){
    if(success) res.sendStatus(200);
    else res.sendStatus(500);
  });
});
router.post('/posts/edit/:id',function(req, res) {
  postmanager.edit(req.params.id, req.body, function(success){
    if(success) res.sendStatus(200);
    else res.sendStatus(500);
  });
});
router.post('/posts/get/:id',function(req, res) {
  postmanager.get(req.params.id, function(success){
    if(success) {
      tagmanager.getTagsForPost(req.params.id, function(tags){
        success.tags = tagmanager.tagifyTo(tags);
        res.status(200).send(JSON.stringify(success));
      });  
    }
    else res.sendStatus(500);
  });
});

router.post('/films/create',function(req, res) {
  console.log("creating film");
  var result = filmmanager.create(req.body);
  res.sendStatus(200);
});
router.post('/films/remove/:id',function(req, res) {
  filmmanager.remove(req.params.id, function(success){
    if(success) res.sendStatus(200);
    else res.sendStatus(500);
  });
});
router.post('/films/edit/:id',function(req, res) {
  filmmanager.edit(req.params.id, req.body, function(success){
    if(!res.headersSent){
      if(success) res.sendStatus(200);
      else res.sendStatus(500);
    }

  });
});
router.post('/films/get/:id',function(req, res) {
  filmmanager.get(req.params.id, function(success){
    if(success[0]) {
      success=success[0]
      tagmanager.getTagsForFilm(req.params.id, function(tags){
        success.tags = tagmanager.tagifyTo(tags);
        res.status(200).send(JSON.stringify(success));
      });
    }
    else res.sendStatus(500);
  });
});

router.get('/pages', function(req, res, next) {
  res.render('admin/pageeditor', { page:"pages" });
});
router.get('/pages/:id', function(req, res, next) {
    res.status(200).send({content:pagemanger.pages[req.params.id], hint:pagemanger.hints[req.params.id]});
});
router.post('/pages/:id', function(req, res, next) {
  if(pagemanger.haspage(req.params.id)){
    pagemanger.set(req.params.id, req.body.content)
    res.sendStatus(200);
  }
  else{
    res.sendStatus(404);
  }
});

router.get('/tags/:id', function(req,res){
  tagmanager.getTag(req.params.id, function(result){
    res.status(200).send(JSON.stringify(result));
  });
});
router.post('/tags', function(req,res){
  tagmanager.setTag(req.body, function(result){
    res.status(200).send(JSON.stringify(result));
  });
});


router.post('/sql', function(req,res){
  console.log("query="+req.body.query);
  sqlcon.query(req.body.query,function (err, result) {
    if (err) res.status(502).send(JSON.stringify(err));
    else res.status(200).send(JSON.stringify(result));
  });
});

/* GET admin page. */
router.get('/posts', function(req, res, next) {
  postmanager.getall(true, function(posts){
    tagmanager.getAllTags(function(tags){
      tags = JSON.stringify(tagmanager.tagifyAllTags(tags));
      res.render('admin/posts', { page:"posts", posts:posts, tags:tags, settings:settings.get() });
    });
  })
});
router.get('/films', function(req, res, next) {
  filmmanager.getall(true, function(films){
    tagmanager.getAllTags(function(tags){
      tags = JSON.stringify(tagmanager.tagifyAllTags(tags));
      var slugs = [];
      if(films){
        films.forEach(film=>{
          slugs.push(film.slug);
        });
      }
      slugs = JSON.stringify(slugs);
      res.render('admin/films', { page:"films", films:films, tags:tags, settings:settings.get(), slugs:slugs });
  });
});
});
router.get('/breakingnews', function(req, res, next) {
  res.render('admin/breakingnews', { page:"breakingnews", breakingnews:breakingnews.get() });
});
router.post('/breakingnews', function(req, res, next) {
  console.log(req.body);
  breakingnews.set(req.body.title, req.body.subtitle, req.body.url, req.body.start, req.body.end);
  res.sendStatus(200);
});
router.get('/vote', function(req, res, next) {
  res.render('admin/vote', { page:"vote", votes: votemanager.getVotes(), activeId: votemanager.getActiveId(), armedId: votemanager.getArmedId(), settings:settings.get() });
});
router.get('/other', function(req, res, next) {
  tagmanager.getAllTags(function(tags){
    tags = JSON.stringify(tagmanager.tagifyAllTags(tags));
    res.render('admin/other', { page:"other", tags:tags, committee:committee.get() });
  });
});

router.get('/productions', function(req,res,next){
  res.render('admin/productions', { page:"productions", productionspage: productionsmanager.get() })
});
router.post('/productions/current', function(req,res,next){
  productionsmanager.setCurrentProject(req.body.yearname, req.body.filmid, req.body.description, req.body.roadmap, JSON.parse(req.body.timeline), req.body.monthheight, req.body.startdate);
  res.sendStatus(200);
});
router.post('/productions/past', function(req,res,next){
  productionsmanager.setPastProjects(JSON.parse(req.body.projects));
  res.sendStatus(200);
});
router.post('/committee/update', function(req,res,next){
  committee.sync(req.body.ausaurl, req.body.committeename, function(result){
    if(result==undefined) res.sendStatus(500);
    else res.send(result);
  });
});

router.post('/committee/save', function(req,res,next){
  committee.save(req.body, function(result){
    if(result==null) res.sendStatus(200);
    else res.status(500).send(result);
  });
});

function sse(obj, eventname, res){
  res.write("event: "+eventname+"\ndata: "+JSON.stringify(obj)+"\n\n");
  res.flush();
}
function restartapp(){
  console.log("attempting to restart app");
  var restartpath = path.resolve(__dirname, "../tmp/restart.txt");
  var stats = fs.statSync(restartpath)
  console.log("old time="+stats.mtime);
  fs.utimesSync(restartpath,Date.now()/1000,Date.now()/1000);
  stats = fs.statSync(restartpath)
  console.log("new time="+stats.mtime);
}

var exec = require('child_process').exec;
var fs = require('fs');
router.post('/restart', function(req,res,next){
  restartapp();
  res.sendStatus(200);
});
router.get('/update', function(req,res,next){
  res.set({
		'Connection': 'keep-alive',
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache'
  });
  res.write('\n');

  sse({text:"Starting update process..."}, "message", res);
  var oldpackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  exec('git pull', function callback(error, stdout, stderr){
    //check stdout
    sse({text:stdout}, "message", res);
    if(stdout && stdout.toLowerCase().startsWith("already up to date")){
      sse({alert:"The website is already up to date! Are you sure you've pushed your commit to GitHub?"}, "message", res);
      sse({},"end",res);
    }
    else{
      var newpackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      if(JSON.stringify(oldpackage.dependencies) != JSON.stringify(newpackage.dependencies)){
        sse({text:"New dependencies detected, attempting to install them..."}, "message", res);
        exec('npm install', function callback(error, stdout, stderr){
          sse({text:stdout}, "message", res);
          if(error){
            sse({alert:"There was an error while installing the new dependencies!"}, "message", res);
            sse({},"end",res);
          }
          else{
            sse({alert:"The website was succesfully updated!", text:"Restarting server"}, "message", res);
            sse({},"end",res);
            restartapp();
          }
        });
      }
      else{
        sse({alert:"The website was succesfully updated!", text:"Restarting server"}, "message", res);
        sse({},"end",res);
        res.end();
        restartapp();
      }
    }
  });
});
var filemanager = require('../managers/filemanager');
router.use(filemanager.router);

router.get('/auditions', function(req, res) {
  // Prepare the context
  auditionmanager.getall(function(results){
      res.render('admin/auditions',{page:'auditions', auditions:results});
  })
  
});

router.post('/auditions/create',function(req, res) {
  var result = auditionmanager.create(req.body, function(success){
    if(success) res.sendStatus(200);
    else res.sendStatus(500);
  });
});
router.post('/auditions/remove/:id',function(req, res) {
  auditionmanager.remove(req.params.id, function(success){
    if(success) res.sendStatus(200);
    else res.sendStatus(500);
  });
});
router.post('/auditions/edit/:id',function(req, res) {
  auditionmanager.edit(req.params.id, req.body, function(success){
    if(success) res.sendStatus(200);
    else res.sendStatus(500);
  });
});
router.post('/auditions/get/:id',function(req, res) {
  auditionmanager.get(req.params.id, function(success){
    if(success) {
        res.status(200).send(JSON.stringify(success));
    }
    else res.sendStatus(500);
  });
});
router.get('/auditions/responses/:id',function(req,res){
  if(req.query.key){
    auditionmanager.verifykey(req.params.id, req.query.key, function(valid){
      if(valid){
        auditionmanager.getanswertable(req.params.id, function(table){
          res.render('admin/auditionresponses',{html:table});
        }, true);
      }
      else{
        res.status(403).render('error',{ page:'error', error:{status:403}, message:"Forbidden", moreinfo:"Sorry, you are not allowed to view this data" });
      }
    });
  }
  else{
    auditionmanager.getanswertable(req.params.id, function(table){
      res.render('admin/auditionresponses',{html:table});
    }, false);
  }
});

router.get('/equipment', function(req,res,next){
  if(req.query.show==undefined){
    res.redirect('/admin/equipment?show=active,archived')
  }
  else{
    var setsobj = settings.get();
    equipmentmanager.getEquipment(function(err1, equipmentlist){
      if(err1){
        res.status(500).render('error', {page:'error', error:{status:500}, message:"Unable to load equipment list!", moreinfo:err1.message })
      }
      else{
        let toshow = [];
        if(req.query.show) toshow = req.query.show.split(',')
        equipmentmanager.getBookings(toshow.includes("active"),toshow.includes("archived"),toshow.includes("alltime"),req.query.year, function(err2,bookinglist){
          if(err2){
            res.status(500).render('error', {page:'error', error:{status:500}, message:"Unable to load equipment bookings!", moreinfo:err2.message })
          }
          else{
            if(req.query.ajax){
              res.send(bookinglist);
            }
            else{
              res.render('admin/equipment', { page:"equipment", equipment: equipmentlist, bookings: bookinglist, filtertoshow: toshow, year: req.query.year, settings:setsobj })
            }
          }
        });
      }
    });
  }
});


router.post('/equipment/items/create',function(req, res) {
  equipmentmanager.createEquipment(req.body, function(err, result){
    if(err) res.status(500).send({errors:err});
    else res.status(200).send(result);
  })
});
router.post('/equipment/items/remove/:id',function(req, res) {
  equipmentmanager.removeEquipment(req.params.id, function(success){
    if(success) res.sendStatus(200);
    else res.sendStatus(500);
  });
});
router.post('/equipment/items/edit/:id',function(req, res) {
  equipmentmanager.editEquipment(req.params.id, req.body, function(success){
    if(!res.headersSent){
      if(success) res.sendStatus(200);
      else res.sendStatus(500);
    }

  });
});
router.post('/equipment/items/reposition', function(req,res){
  equipmentmanager.repositionEquipment(req.body, function(success){
    if(success) res.sendStatus(200);
    else res.sendStatus(200);
  });
});
router.get('/equipment/items/:id',function(req, res) {
  equipmentmanager.getEquipmentById(req.params.id, function(err,item){
    if(err) res.status(500).send(err);
    else res.status(200).send(item[0]);
  });
});

router.post('/equipment/bookings/remove/:id',function(req, res) {
  equipmentmanager.removeBookingBatch(req.params.id, function(err,item){
    if(err) res.status(500).send(err);
    else res.sendStatus(200);
  })
});
router.post('/equipment/bookings/archive/:id/:archivestate',function(req, res) {
  equipmentmanager.archiveBookingBatch(req.params.id, req.params.archivestate, function(err,item){
    if(err) res.status(500).send(err);
    else res.sendStatus(200);
  })
});
router.post('/equipment/bookings/:id',function(req, res) {
  equipmentmanager.saveBookingBatch(req.params.id, req.body, function(err,item){
    if(err) res.status(500).send(err);
    else res.sendStatus(200);
  });
});



router.get('/', function(req, res) {
  // Prepare the context
  res.redirect("/admin/posts");
});


module.exports = router;