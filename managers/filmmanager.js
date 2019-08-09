var filmmanager = {}
var tagmanager = require("./tagmanager");
var filemanager = require("./filemanager");

filmmanager.create = function(film){
    
    if(film.title){
        filemanager.consolidateFileSession(film.sessionid);
        var id = Date.now().toString();
        var sql = "INSERT INTO Films (id, title, youtubeid, date, description, credits, behindthescenes, techspecs, hidden, slug, files) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
        sqlcon.query(sql, [id, film.title, film.youtubeid, film.date, film.description, film.credits, film.behindthescenes, film.techspecs, film.hidden, film.slug, film.files],function (err, result) {
            if (err) return err;
            tagmanager.newTagging(id,undefined, tagmanager.tagifyFrom(film.tags), function(){
            });
            return id;
        });
    }
}
filmmanager.edit = async function(id, film, resolve){
    filemanager.consolidateFileSession(film.sessionid);
    sqlcon.query("SELECT * FROM Films WHERE id=?", [id], function(err,oldfilm){
        var oldfiles = JSON.parse(oldfilm[0].files);
        var newfiles = JSON.parse(film.files);
        var oldfilenames = [];//This is what we want to compare, not the captions
        var newfilenames = [];
        if(oldfiles){
            oldfiles.forEach(file=>{
                oldfilenames.push(file.name);
            });
        }
        if(newfiles){
            newfiles.forEach(file=>{
                newfilenames.push(file.name);
            });
        }
        let obsoleteFilenames = oldfilenames.filter(x => !newfilenames.includes(x));
        console.log("obsolete files=");
        console.log(obsoleteFilenames);
        filemanager.removeObsoleteFiles(obsoleteFilenames);
        console.log("selected pre-modification film");
        if(!err && oldfilm && oldfilm[0])
        if(oldfilm[0].slug != film.slug){
            sqlcon.query("INSERT INTO SlugRedirects (oldslug, id, type) VALUES (?,?,?)", [oldfilm[0].slug, id, "film"], function(err,result){
                finishediting(id,film,resolve);
            });
        }
        else{
            finishediting(id,film,resolve);
        }
      
    });
    
}
function finishediting(id,film,resolve){
    console.log("called finishediting");
    var sql = "UPDATE Films SET title=?, youtubeid=?, date=?, description=?, credits=?, behindthescenes=?, techspecs=?, hidden=?, slug=?, files=? WHERE id=?";
    sqlcon.query(sql,[film.title, film.youtubeid, film.date, film.description, film.credits, film.behindthescenes, film.techspecs, film.hidden, film.slug, film.files, id], 
        function (err, result) {
            console.log("Updated in finishedediting")
        if (err) resolve(false);
        else{
            tagmanager.newTagging(id,undefined, tagmanager.tagifyFrom(film.tags), function(){
                resolve(true);
            });
        }
    });
}
filmmanager.getall = function(gethidden, resolve){
    var additional = "";
    if(!gethidden){
        additional="where hidden=false"
    }
    var sql = "SELECT * FROM Films " + additional + " ORDER by date DESC";
        sqlcon.query(sql,function (err, result) {
        if (err) resolve(undefined);
        else resolve(result);
    });
}
filmmanager.get = function(filmid, resolve){
    console.log("filmmanager.get()")
    var sql = "SELECT * FROM Films where `id` IN (?) ORDER by date DESC";
    sqlcon.query(sql,[filmid] ,function (err, result) {
        if (err) resolve(undefined);
        else resolve(result);
    });
}
filmmanager.getbyslug = function(slug, resolve){
    var sql = "SELECT * FROM Films where `slug` IN (?) ORDER by date DESC";
    sqlcon.query(sql,[slug] ,function (err, result) {
        if (err) resolve(undefined);
        else resolve(result);
    });
}
filmmanager.getrecommended = function(id, resolve){
var sql = `
SET @item = ?;

SELECT * FROM Films WHERE id in (

SELECT
  filmid
FROM
  Taggings
WHERE
  tagid IN (SELECT tagid FROM Taggings WHERE filmid=@item)
  AND filmid!=@item
GROUP BY
filmid
HAVING
  COUNT(*) = (
    SELECT
      COUNT(*)
    FROM
    Taggings
    WHERE
    tagid IN (SELECT tagid FROM Taggings WHERE filmid=@item)
      AND filmid!=@item
    GROUP BY
        filmid
    ORDER BY
      COUNT(*) DESC
    LIMIT 1
  )
)`

  sqlcon.query(sql, [id], function(err, results){
      if(err || !results[1]){
          console.log(err);
          resolve(undefined);
      } 
      else resolve(results[1]);
  })
}
filmmanager.homepage = function(count, resolve){
    console.log("filmmanager.homepage()");
    if(count<0) count==0;
    var sql = "SELECT * FROM Films where hidden=false ORDER by date DESC LIMIT "+(Number.parseInt(count));
        sqlcon.query(sql, function (err, result) {
        if (err) resolve(undefined);
        else resolve(result);
    });
}
filmmanager.remove = function(filmid, resolve){
    sqlcon.query("SELECT * FROM Films WHERE id=?", [filmid], function(err,oldfilm){
        var oldfiles = JSON.parse(oldfilm[0].files);
        var oldfilenames = []; //This is what we want to compare, not the captions
        oldfiles.forEach(file=>{
            oldfilenames.push(file.name);
        });
        filemanager.removeObsoleteFiles(oldfilenames);
        sqlcon.query("DELETE FROM Films where id=?",[filmid] ,function (err) {
            if (err) resolve(false);
            else resolve(true);
        });
    });
}


module.exports = filmmanager;