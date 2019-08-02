var postmanager = {}
var tagmanager = require("./tagmanager");
var filemanager = require("./filemanager");

postmanager.create = function(post, resolve){
    if(post.title){
        filemanager.consolidateFileSession(post.sessionid);
        if(!post.subtitle) post.subtitle = " ";
        var id = Date.now().toString();
        var sql = "INSERT INTO Posts (id, title, subtitle, content, hidden, author, redirect, files) VALUES (?,?,?,?,?,?,?,?)";
        sqlcon.query(sql, [id, post.title, post.subtitle, post.content, post.hidden, post.author, post.redirect, post.files],function (err, result) {
            if (err) resolve(false);
            tagmanager.newTagging(undefined,id, tagmanager.tagifyFrom(post.tags), function(){
                resolve(true);
            });
        });
    }
}
postmanager.edit = function(id, post, resolve){
    filemanager.consolidateFileSession(post.sessionid);
    sqlcon.query("SELECT * FROM Posts WHERE id=?", [id], function(err,oldpost){
        var oldfiles = JSON.parse(oldpost[0].files);
        var newfiles = JSON.parse(post.files);
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

        if(!post.subtitle) post.subtitle = " ";
            sqlcon.query("UPDATE Posts SET title=?, subtitle=?, content=?, hidden=?, author=?, redirect=?, files=? WHERE id=?",
                        [post.title,post.subtitle,post.content, post.hidden,post.author,post.redirect,post.files, id], 
                function (err, result) {
            if (err) resolve(false);
            tagmanager.newTagging(undefined,id, tagmanager.tagifyFrom(post.tags), function(){
    
            });
            resolve(true);
        });
    });

}
postmanager.getall = function(gethidden, resolve){
    var additional = "";
    if(!gethidden){
        additional="where hidden=false"
    }
    var sql = "SELECT * FROM Posts " + additional + " ORDER by id DESC";
        sqlcon.query(sql,function (err, result) {
        if (err) resolve(undefined);
        console.log(result);
        resolve(result);
    });
}
postmanager.get = function(postid, resolve){
    var sql = "SELECT * FROM Posts where id=?";
        sqlcon.query(sql,[postid] ,function (err, result) {
        if (err) resolve(undefined);
        if(result){
            console.log(result[0]);
            resolve(result[0]);
        }
        else resolve(undefined);
    });
}
postmanager.homepage = function(count, resolve){
    if(count<0) count==0;
    var sql = "SELECT * FROM Posts where hidden=false ORDER by id DESC LIMIT "+(Number.parseInt(count)+1); //+1 is necessary to take into account hero thing
        sqlcon.query(sql, function (err, result) {
        if (err) resolve(undefined);
        console.log(result);
        resolve(result);
    });
}
postmanager.remove = function(postid, resolve){
    sqlcon.query("SELECT * FROM Posts WHERE id=?", [postid], function(err,oldpost){
        var oldfiles = JSON.parse(oldpost[0].files);
        var oldfilenames = []; //This is what we want to compare, not the captions
        oldfiles.forEach(file=>{
            oldfilenames.push(file.name);
        });
        filemanager.removeObsoleteFiles(oldfilenames);
        sqlcon.query("DELETE FROM Posts where id=?",[postid] ,function (err) {
            if (err) resolve(false);
            resolve(true);
        });
    });

}


module.exports = postmanager;