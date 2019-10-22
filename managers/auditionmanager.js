var auditionmanager = {}
var filmmanager = require('./filmmanager');

auditionmanager.create = function(audition,resolve){
    if(audition.filmid){
        var id = Date.now().toString();
        var sql = "INSERT INTO Auditions (filmid, description, title, form, emails, id) VALUES (?,?,?,?,?,?)";
        sqlcon.query(sql, [audition.filmid, audition.description, audition.title, audition.form, audition.emails, id],function (err, result) {
            console.log(result);
            if (err) resolve(false);
            else{
                resolve(true);
            }
        });
    }
    else{
        resolve(false);
    }
}
auditionmanager.edit = function(filmid, audition, resolve){
    if(audition.filmid){
        var sql = "UPDATE Auditions SET description=?, title=?, form=?, emails=? WHERE filmid=?";
        sqlcon.query(sql, [audition.description, audition.title, audition.form, audition.emails, audition.filmid],function (err, result) {
            if (err) resolve(false);
            else{
                resolve(true);
            }
        });
    }
    else{
        resolve(false);
    }
}
auditionmanager.get = function(filmid, resolve){
    var sql = "SELECT * FROM Auditions where filmid=?";
    sqlcon.query(sql,[filmid],function (err, result) {
        if (err) resolve(undefined);
        else resolve(result[0]);
    });
}
auditionmanager.getall = function(resolve){
    var sql = "SELECT * FROM Auditions ORDER by id DESC";
    sqlcon.query(sql,function (err, result) {
        if (err) resolve(undefined);
        else resolve(result);
    });
}


auditionmanager.remove = function(filmid,resolve){
    sqlcon.query("DELETE FROM Auditions where filmid=?",[filmid] ,function (err) {
        if (err) resolve(false);
        else resolve(true);
    });
}

auditionmanager.getanswers = function(auditionid, resolve){
    var sql = "SELECT * FROM AuditionResponses where auditionid=? ORDER by id DESC";
    sqlcon.query(sql,[filmid],function (err, result) {
        if (err) resolve(undefined);
        else resolve(result);
    });
}

module.exports = auditionmanager;