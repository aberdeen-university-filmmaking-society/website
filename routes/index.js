var express = require('express');
var html2text = require('html2plaintext');
var router = express.Router();
var postmanager = require('../managers/postmanager');
var filmmanager = require('../managers/filmmanager');
var pagemanager = require('../managers/custompagemanager')
var productionsmanager = require('../managers/productionsmanager');
var tagmanager = require('../managers/tagmanager');
var moment = require('moment');
var committee = require('../managers/committee');
var settings = require('../managers/settings');
var QuillDeltaToHtmlConverter = require('quill-delta-to-html').QuillDeltaToHtmlConverter;

function setdetails(post, timestamp, includeauthor){
  post.details = moment(Number.parseInt(timestamp)).fromNow();
  var date = new Date(Number.parseInt(timestamp));
  post.dateformatted=formatDate(date)
  post.precisedate = moment(date).format("ddd Do MMMM YYYY, HH:mm");
  try{
    post.files = JSON.parse(post.files);
    if(post.files && post.files.length && post.files.length>0){
      post.image = {};
      post.files.forEach(file=>{
        if(file.type=="hero"){
          post.image.full = "/files/"+file.name+"_full."+file.extension;
          post.image.thumb = "/files/"+file.name+"_thumb."+file.extension;
          post.image.caption = file.caption;
        }
      });
    }
  }
  catch(err){console.log(err)}

  if(includeauthor && post.author)
    post.details+= "   ·   " + post.author;
  return post;
}
function formatDate(date) {
  var monthNames = [
    "January", "February", "March",
    "April", "May", "June", "July",
    "August", "September", "October",
    "November", "December"
  ];
  var monthIndex = date.getMonth();
  var year = date.getFullYear();
  return monthNames[monthIndex] + ' ' + year;
}
function formatDatePrecise(date){
  var timestamp = date.getTime();
  var now = Date.now();
  if(timestamp>now){
    //Show full date
    return moment(timestamp).format("Do	MMMM YYYY");
  }
  else{
    //Show more succint date
    return formatDate(date);
  }
}
function deltaToHtml(delta){
  if(delta.length<=1 && delta[0]["insert"] && delta[0]["insert"].trim().length==0)
    return undefined;
  else
    return new QuillDeltaToHtmlConverter(delta, {}).convert();
}

/* GET home page. */
router.get('/', function(req, res, next) {
  var setsobj = settings.get();
  postmanager.homepage(setsobj.homepage_postcount, function(results){
    if(setsobj.heropost){
      var heropost = undefined;
      for(var i in results){
        if(results[i].id == setsobj.heropost){
          heropost = results[i];
          results.splice(i,1);
          break;
        }
      }
      if(heropost == undefined){
        heropost = postmanager.get(setsobj.heropost,function(hp){
          finishIndexResponse(req,res, results, setsobj, hp);
        });
      }
      else{
        finishIndexResponse(req,res, results, setsobj, heropost)
      }
    }
    else{
      finishIndexResponse(req,res,results,setsobj,undefined);
    }
  })
});

function finishIndexResponse(req,res, results, setsobj, heropost){
  if(results){
    if(results.length>setsobj.homepage_postcount) results.length=setsobj.homepage_postcount;
    for (let index = 0; index < results.length; index++) {
      results[index]=setdetails(results[index], results[index].id, false);
    }
  }
  productionsmanager.get()
  var pastids = [];
  productionsmanager.get().past.forEach(project=>{
    pastids.push(project.filmid);
  });
  filmmanager.homepage(setsobj.homepage_filmcount, function(films){
    filmmanager.get(pastids, function(productionsfilms){
      var productionsfilmsProcessed = [];
      if(productionsfilms){
        productionsfilms.forEach(film=>{
          productionsfilmsProcessed.push(filmFilesToImages(film));
        });
      }

      if(heropost)
        res.render('index', { page:'home', fadein:req.cookies["fadein"], films:films, posts:results, heropost: setdetails(heropost, heropost.id, true), productionsfilms:productionsfilmsProcessed});
      else
        res.render('index', { page:'home', fadein:req.cookies["fadein"], films:films, posts:results, productionsfilms:productionsfilmsProcessed });
    });
});

}

router.get('/about', function(req, res, next) {
  res.render('about', { page:'about', committee: committee.get() });
});
router.get('/about/constitution', function(req, res, next) {
  res.render('constitution', { page:'constitution'});
});
router.get('/about/privacy', function(req, res, next) {
  res.render('privacy', { page:'privacy'});
});
router.get('/about/founder', function(req, res, next) {
  res.render('founder', { page:'founder'});
});
router.get('/productions', function(req, res, next) {
  var prodpage = productionsmanager.get();
  var pastids = [];
  prodpage.past.forEach(project=>{
    pastids.push(project.filmid);
  });
  tagmanager.getPostsForTagAfter("aufsproductions",prodpage.current.startdate,function(posts){
    if(posts){
      posts.forEach(post=>{
        post = setdetails(post, post.id, true);
      })
    }
    if(pastids.length>0){
      filmmanager.get(pastids,  function(pastfilms){
        var pastprojects = [];
        if(pastfilms){
          pastfilms.forEach(film=>{
            for(var i in prodpage.past){
              if(prodpage.past[i].filmid==film.id){
                film.description = deltaToHtml(JSON.parse(film.description).ops);
                film.behindthescenes = JSON.parse(film.behindthescenes);
                film.behindthescenes.story = deltaToHtml(JSON.parse(film.behindthescenes.story).ops);
                film = filmFilesToImages(film);
                pastprojects.push({year: prodpage.past[i].year, film: setdetails(film)})
                break;
              }
            }
          });
          pastprojects.sort(function(a, b) {
            var textA = a.year.toUpperCase();
            var textB = b.year.toUpperCase();
            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
          });
        }
        pastprojects.sort((a, b) => (a.year < b.year) ? 1 : -1);
        res.render('aufsproductions', { page:'aufsproductions', body: productionsmanager.get(), pastprojects:pastprojects, posts:posts});
      });
    }
    else{
      res.render('aufsproductions', { page:'aufsproductions', body: productionsmanager.get(), posts:posts});
    }
  });
});
router.get('/faq', function(req, res, next) {
  res.render('faq', { page:'faq', body: pagemanager.pages.faq});
});

router.get('/posts', function(req, res, next) {
  postmanager.getall(false, function(results){
    for (let index = 0; index < results.length; index++) {
      results[index]=setdetails(results[index], results[index].id, false);
    }
    res.render('allposts', { page:'posts', posts:results });
  });
});


router.get('/posts/:id', function(req, res, next) {
  postmanager.get(req.params.id, function(result){
    if(result){
      tagmanager.getTagsForPost(req.params.id,function(tags){
        //result.content = deltaToHtml(JSON.parse(result.content).ops);
        result = setdetails(result, req.params.id, true);
        res.render('post', { page:'post', post:result, tags:tags });
      });
    }
    else{
      res.render('error',{ page:'error', error:{status:404, stack:""}, message:"Not found" });
    }
  });
});

router.get('/films', function(req, res, next) {
  filmmanager.getall(false, function(results){
    results.forEach(result=>{
      result.dateformatted=formatDate(new Date(Number.parseInt(result.date)));
      result.dateprecise=formatDatePrecise(new Date(Number.parseInt(result.date)));
    });
    res.render('allfilms', { page:'films', films:results });
  });
});

function filmFilesToImages(result){
  if(result.files){
    try{
      result.files = JSON.parse(result.files);
      if(result.files.length && result.files.length>0){
        result.files.forEach(file=>{
          var fileobj={
              full:"/files/"+file.name+"_full."+file.extension,
              thumb: "/files/"+file.name+"_thumb."+file.extension,
              caption: file.caption
          };
          if(file.type=="poster"){
            result.poster = fileobj;
          }
          else if(file.type=="btspic"){
            result.behindthescenes.pics.push(fileobj);
          }
        });
      }
    }catch(error){}
  }
  return result;
}

router.get('/films/:slug', function(req, res, next) {
  var SLUG = req.params.slug;
  console.log("slug="+SLUG);
  filmmanager.getbyslug(req.params.slug, function(result){
    if(result[0]){
      result = result[0]
      tagmanager.getTagsForFilm(result.id,function(tags){
        result.behindthescenes = JSON.parse(result.behindthescenes);
        result.credits = JSON.parse(result.credits);
        result.techspecs = JSON.parse(result.techspecs);
        result.description = deltaToHtml(JSON.parse(result.description).ops);
        result.shortdesc = "Aberdeen University Filmmaking Society";
        if(result.description) result.shortdesc = html2text(result.description);
        result.behindthescenes.story = deltaToHtml(JSON.parse(result.behindthescenes.story).ops);
        result.date = formatDatePrecise(new Date(Number.parseInt(result.date)));
        result.dateTimestamp = Number.parseInt(result.date);
        result.behindthescenes.pics = [];
        result = filmFilesToImages(result);
        filmmanager.getrecommended(result.id, result.dateTimestamp, function(similar){
          res.render('film', { page:'film', film:result, tags:tags, recommended:similar });
        });
      });
    }
    else{
      sqlcon.query("SELECT * FROM `SlugRedirects` WHERE `oldslug`=? AND `type`=?", [SLUG, "film"], function(err, redirect){
        console.log("REDIRECT="+redirect);
        if(!err && redirect && redirect[0]){
          filmmanager.get(redirect[0].id, function(realfilm){
            if(!err && realfilm && realfilm[0]) res.redirect(302, "/films/"+realfilm[0].slug);
            else res.render('error',{ page:'error', error:{status:404, stack:""}, message:"Not found" });
          })
        }
        else{
          res.render('error',{ page:'error', error:{status:404, stack:""}, message:"Not found" });
        }
      });
    }
  });
});

router.get('/tags/:tag', function(req, res, next) {
  tagmanager.getContentForTag(req.params.tag, req.query.filter, function(results){
    var joined=[];
    if(results[0]){
      results[0].forEach(film=>{
        film.type="film";
        film.timestamp = Number.parseInt(film.date);
        film.dateformatted=formatDate(new Date(film.timestamp));
        film.dateprecise=formatDatePrecise(new Date(Number.parseInt(film.date)));
        joined.push(film);
      });
    }
    if(results[1]){
      results[1].forEach(post=>{
        post.type="post";
        post.timestamp = Number.parseInt(post.id);
        post.dateformatted=formatDate(new Date(post.timestamp))
        joined.push(setdetails(post, post.timestamp, false));
      });
    }
    
    joined.sort(function(obj1, obj2) {
    return obj2.timestamp - obj1.timestamp;
  });
  tagmanager.getTag(req.params.tag, function(tag){
    tag = tag[0]
    if(tag){
      if(tag.description) {
        tag.description = deltaToHtml(JSON.parse(tag.description).ops);
        tag.shortdesc = html2text(tag.description);
      }
      
      res.render('tags',{ page:'tags', results:joined, tag:tag, filter:req.query.filter });
    }
    else{
      res.render('error',{ page:'error', error:{status:404, stack:""}, message:"No content tagged with '"+req.params.tag+"'" });
    }
  });
});
  
});

module.exports = router;
