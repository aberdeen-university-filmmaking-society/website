var express = require('express');
var router = express.Router();
var HOMEURL = process.env.URL_START;
var sitemap = require('sitemap'),
sm = sitemap.createSitemap({
    hostname : "aufilmmaking.com",
    cacheTime : 1000 * 60 * 24  //keep the sitemap cached for 24 hours
});

function createSitemap(resolve){
    sm.add({ url: HOMEURL + '/', changefreq:'weekly', priority:1 })
    sm.add({ url: HOMEURL + '/faq', changefreq:'monthly', priority:0.9 })
    sm.add({ url: HOMEURL + '/about', changefreq:'yearly', priority:0.9 })
    sm.add({ url: HOMEURL + '/about/constitution', changefreq:'yearly', priority:0.5 })
    sm.add({ url: HOMEURL + '/about/founder', changefreq:'never', priority:0.6 })
    sm.add({ url: HOMEURL + '/productions', changefreq:'weekly', priority:0.6 })
    sm.add({ url: HOMEURL + '/films', changefreq:'monthly', priority:0.7 })
    sm.add({ url: HOMEURL + '/posts', changefreq:'monthly', priority:0.7 })
    sqlcon.query("SELECT slug FROM `Films`", function(err,films){
        if(!err && films){
            films.forEach(film=>{
                sm.add({
                    url : HOMEURL + '/films/' +  film.slug,
                    changefreq :'monthly',
                    priority:0.6
                });
            });
        }
        sqlcon.query("SELECT id FROM `Posts`", function(err,posts){
            if(!err && posts){
                posts.forEach(post=>{
                    sm.add({
                        url : HOMEURL + '/posts/' +  post.id,
                        changefreq :'monthly',
                        priority:0.4
                    });
                });
            }
            sqlcon.query("SELECT id FROM `Tags`", function(err,tags){
                if(!err && tags){
                    tags.forEach(tag=>{
                        var priority = 0.2;
                        if(tag.fullname || tag.description) priority = 0.3;
                        if(tag.fullname && tag.description) priority = 0.4;
                        sm.add({
                            url : HOMEURL + '/tags/' +  tag.id,
                            changefreq :'monthly',
                            priority:priority
                        });
                    });
                    resolve();
                }
            });
        });
    });
}
 
router.get('/sitemap.xml', function(req, res, next){   
    //only update the sitemap if the cache is expired
    if (sm.isCacheValid()){
        res.header('Content-Type', 'application/xml');
        res.send( sm.cache );
    }
    else{
        //remove every page from the expired sitemap
        sm.urls = [];
        //get every post from the database
        createSitemap(function(){
            res.header('Content-Type', 'application/xml');
            res.send( sm.toString() );
        })      
    }
})

module.exports = router;