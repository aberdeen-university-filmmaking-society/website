var storage = {};

storage.load = function(name, structure, resolve){
    sqlcon.query("SELECT * FROM Storage WHERE name=?", [name], function(err,results){
        if(results != undefined && results.length != undefined && results.length>0){
            if(results[0]!=undefined)
            var result;
            try {
                console.log("Loading " + name + " from storage")
                console.log("json="+results[0].value);
                result = JSON.parse(results[0].value);
            }catch(err){}
            if(result != undefined){
                resolve(result);
            }
            else{
                resolve(structure);
            }
        }
        else {
            sqlcon.query("INSERT INTO Storage (name,value) VALUES (?,?)", [name, JSON.stringify(structure)], function(err,results){
                if(err){
                    console.error("Failed to load storage: " + err);
                }
                resolve(structure);
            });
        }
    });
}

storage.save = function(name, structure, resolve){
    sqlcon.query("INSERT IGNORE INTO Storage (name,value) VALUES (?,?)", [name, JSON.stringify(structure)], function(err,results){
        if(err){
            console.error("Failed to load storage: " + err);
        }
    });
}

module.exports=storage;