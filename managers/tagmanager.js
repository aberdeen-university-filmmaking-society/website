var tagmanager = {}

tagmanager.tagifyFrom = function(valuearray){
    if(valuearray){
        return valuearray.split(",");
    }
   else{
       return undefined;
   }
}
tagmanager.tagifyTo = function(rows){
    if(rows){
        var output = [];
        rows.forEach(row=>{
            output.push(row.tagid);
        })
        return output.join(",");
    }
    else{
        return undefined;
    }
}
tagmanager.tagifyAllTags = function(rows){
    if(rows){
        var output = [];
        rows.forEach(row=>{
            output.push(row.id);
        })
        return output;
    }
    else{
        return undefined;
    }
}

tagmanager.getTagsForFilm = function(id, resolve){
    //select `Taggings` where filmid = id;
    sqlcon.query("SELECT * FROM Taggings WHERE filmid=?", [id], function (err, result) {
        if (err) resolve(undefined);
        else resolve(result);
    });
}
tagmanager.getFilmsForTag = function(tagid, resolve){
    sqlcon.query("SELECT * FROM Films WHERE id in (SELECT filmid FROM Taggings WHERE tagid = ?)", [tagid], function(err,results){
        if(err) resolve(undefined);
        else resolve(results);
    });
}
tagmanager.getPostsForTag = function(tagid, resolve){
    sqlcon.query("SELECT * FROM Posts WHERE id in (SELECT postid FROM Taggings WHERE tagid = ?)", [tagid], function(err,results){
        if(err) resolve(undefined);
        else resolve(results);
    });
}
tagmanager.getPostsForTagAfter = function(tagid, minimumdate, resolve){
    sqlcon.query("SELECT * FROM Posts WHERE id in (SELECT postid FROM Taggings WHERE tagid = ?) AND id > ?", [tagid, minimumdate], function(err,results){
        if(err) resolve(undefined);
        else resolve(results);
    });
}
tagmanager.getTagsForPost = function(id, resolve){
    //select `Taggings` where postid = id;
    sqlcon.query("SELECT * FROM Taggings WHERE postid=?", [id], function (err, result) {
        if (err) resolve(undefined);
        else resolve(result);
    });
}
tagmanager.getContentForTag = function(tagid,filter, resolve){
    if(filter) filter = filter.toLowerCase();
    if(filter == "films"){
        sqlcon.query("SELECT * FROM Films WHERE id in (SELECT filmid FROM Taggings WHERE tagid = ?)", [tagid], function(err,results){
            if(err) resolve(undefined);
            else resolve([results,undefined])
        });
    }
    else if(filter == "posts"){
        sqlcon.query("SELECT * FROM Posts WHERE id in (SELECT postid FROM Taggings WHERE tagid = ?)", [tagid], function(err,results){
            if(err) resolve(undefined);
            else resolve([undefined, results])
        });
    }
    else{
        sqlcon.query("SELECT * FROM Films WHERE id in (SELECT filmid FROM Taggings WHERE tagid = ?); SELECT * FROM Posts WHERE id in (SELECT postid FROM Taggings WHERE tagid = ?)", [tagid, tagid], function(err,results){
            if(err) resolve(undefined);
            else resolve(results)
        });
    }
    
}
tagmanager.getRelatedFilms = function(tagids, limit){
    
    //var films = {};
    //foreach (tagid in tagids){
    //  var commonfilms = select films with tagid in `Taggings`
    //  foreach(film in commonfilms){
    //      films[film]++;
    //  }
    //}
    //order films by count of tags in common, and limit to 10
}
tagmanager.getRelatedPosts = function(tagids, limit){
    //var films;
    //foreach (tag in tagids){
    //    
    //
    //}
    //select filmids where id in filmids
    //select postids where id in postids
}
tagmanager.newTagging = function(filmid, postid, tagids, resolve){
    var taggingsInsertArray = [];
    var tagInsertArray = [];
    if(tagids){
        tagids.forEach(tagid=>{
            taggingsInsertArray.push([filmid, postid, tagid]);
            tagInsertArray.push([tagid]);
        });

    console.log("Inserting tags:"+tagInsertArray.join(','));
    var sql1 = "INSERT IGNORE INTO Tags (`id`) VALUES ?";
    sqlcon.query(sql1, [tagInsertArray], function (err, result) {
        if(err){
            console.log(err);
        }
        else{
            var usedid = filmid;
            var sql2 = "DELETE FROM Taggings WHERE filmid=?; INSERT INTO Taggings (`filmid`,`postid`,`tagid`) VALUES ?";
            if(postid){
                sql2 =  "DELETE FROM Taggings WHERE postid=?; INSERT INTO Taggings (`filmid`,`postid`,`tagid`) VALUES ?"
                usedid=postid;
            } 
            sqlcon.query(sql2, [usedid, taggingsInsertArray], function (err, result) {
                if (err) {
                    console.log(err);
                    resolve(undefined);
                }
                else{
                    if(result) resolve(result[0]);
                    else resolve(undefined);
                }
            });
        }
    });
    tagmanager.purgeTags();
    //PSEUDO-CODE:
    //foreach tagid in tagids{
    //    if tagid missing from `Tags`
    //         add tagid to `Tags`
    //}
    //remove all tagids from `Taggings`
    //add all tagids to `Taggings`
}
}

tagmanager.purgeTags = function(){
    //make array of tagi
    var sql = `
    DELETE Tags 
    FROM Tags 
    WHERE NOT EXISTS (SELECT 1 
                      FROM Taggings 
                      WHERE Tags.Id = Taggings.tagid)
    AND Tags.fullname = NULL
    AND Tags.description = NULL`
    sqlcon.query(sql);
}
tagmanager.getOccurence = function(resolve){
    var sql = `SELECT tagid, COUNT(1) as count 
    FROM Taggings 
    GROUP BY tagid 
    ORDER BY count DESC;`
    sqlcon.query(sql,function (err, result) {
        if (err) resolve(undefined);
        else resolve(result);
});
}

tagmanager.removeTag = function(tagid){
    //REMOVE `tagid` in Tags
}

tagmanager.getAllTags = function(resolve){
    //SELECT ALL FROM TAGS
    var sql = "SELECT * FROM Tags";
        sqlcon.query(sql,function (err, result) {
            if (err) resolve(undefined);
            else resolve(result);
    });
}

tagmanager.getTag = function(id, resolve){
    //SELECT ALL FROM TAGS
    var sql = "SELECT * FROM Tags where id=?";
        sqlcon.query(sql,[id],function (err, result) {
            if (err) resolve(undefined);
            else resolve(result);
    });
}
tagmanager.setTag = function(tagobject, resolve){
    console.log(tagobject);
    sqlcon.query("SELECT * FROM Tags where id=?", [tagobject.id], function(err,results){
        if(!err && results.length>0){
            //Tag already exists, simply alter it
            sqlcon.query("UPDATE Tags SET `fullname`= ?, `description`= ? WHERE id=?",[tagobject.fullname, tagobject.description, tagobject.id],function (err, result) {
                console.log(err);
                if (err) resolve(undefined);
                else resolve(result);
            });
        }
        else{
            var sql = "INSERT INTO Tags (`id`,`fullname`,`description`) VALUES (?,?,?)";
            sqlcon.query(sql,[tagobject.id, tagobject.fullname, tagobject.description],function (err, result) {
                console.log(err);
                if (err) resolve(undefined);
                else resolve(result);
        });
        }
    })
}


module.exports = tagmanager;