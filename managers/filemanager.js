var filemanager = {};
const express = require('express');
filemanager.router = express.Router();
const mv = require('mv');
const mkdirp = require('mkdirp');
const fs = require('fs');
const rimraf = require('rimraf');
const path = require('path');
var gm = require('gm');

if(process.env.GM_PATH){
  gm = require('gm').subClass({appPath: process.env.GM_PATH});
}

var consolidatingSessions = [];
var temporaryFiles = {};
/**
 * Move all the files of the specified session out of the temporary folder
 * @param {string} sessionID - The session ID
 */
filemanager.consolidateFileSession = function(sessionID, filmid, postid){
  consolidatingSessions.push(sessionID);
  var sessionfolder = path.resolve(__dirname, "../public/temp")+"/"+sessionID;
  var outputfolder = path.resolve(__dirname, "../public/files");
  fs.readdir(sessionfolder, function (err, files) {
    //listing all files using forEach
    if(files){
      for (let index = 0; index < files.length; index++) {
        mv(sessionfolder+"/"+files[index], outputfolder+"/"+files[index], function(err){
          if(index==files.length-1){
            consolidatingSessions = consolidatingSessions.filter(e => e !== sessionID); //remove the sessionID
            fs.rmdir(sessionfolder);
          }
        });
      }
    }

  });
}
filemanager.router.post('/filemanager/consolidate/:session', function(req,res,next){
  filemanager.consolidateFileSession(req.params.session);
});
filemanager.router.post('/filemanager/upload/:session', function(req,res,next){
  if(req.files){
    var filename = req.files.file.name;
    var fileextension = (/(?:\.([^.]+))?$/).exec(filename);
    if(fileextension){
      fileextension = fileextension[1].toLowerCase();
    }
    var newfilename = req.files.file.md5+Math.floor(Math.random() * 10000).toString();
    var sessionpath = path.resolve(__dirname, "../public/temp")+"/"+req.params.session;
    mkdirp(sessionpath, function(err,newpath){
      if(err) res.sendStatus(500).send({error: "Failed to create session: " + err.message});
      else{
        var pathFull = sessionpath+"/"+newfilename+"_full."+fileextension;
        var pathThumb = sessionpath+"/"+newfilename+"_thumb."+fileextension;
        fs.writeFile(pathFull, req.files.file.data, function(err){
          if(err){
            res.status(500).send({error:"Failed to save file: " + err.message})
          }
          else{
            thumbnailWidth = 200;
            thumbnailHeight = undefined;
            if(req.query.thumbwidth){
              var parsedWidth = Number.parseInt(req.query.thumbwidth);
              if(parsedWidth>0) thumbnailWidth = parsedWidth;
            }
            if(req.query.thumbheight){
              var parsedHeight = Number.parseInt(req.query.thumbheight);
              if(parsedHeight>0) thumbnailHeight = parsedHeight;
            }
            gm(req.files.file.data).resize(thumbnailWidth, thumbnailHeight).write(pathThumb, function(err){
              if(err) res.status(500).send({error:"Failed to save thumbnail: " + err.message});
              else res.status(200).send({name: newfilename, extension:fileextension});
            });
          }
          
        });
      }
    });
  }
  else{
    res.sendStatus(400);
  }
});

filemanager.router.post('/filemanager/remove/:session/:file', function(req,res,next){
  var sessionFolder = path.resolve(__dirname,'../public/temp/'+req.params.session);
  if(req.params.file){
    var files = fs.readdirSync(sessionFolder).filter(fn => fn.startsWith(req.params.file));
    files.forEach(file=>{
      fs.unlink(sessionFolder+"/"+file);
    });
    res.sendStatus(200);
    if(fs.readdirSync(sessionFolder).length==0) fs.rmdir(sessionFolder);
  }
});

filemanager.router.post('/filemanager/remove/:session', function(req,res,next){
  if(consolidatingSessions.indexOf(req.params.session) == -1){
    var sessionFolder = path.resolve(__dirname,'../public/temp/'+req.params.session);
    rimraf(sessionFolder, function(err){
        if(err) res.sendStatus(500);
        else res.sendStatus(200);
    });
  }
  else{
    res.sendStatus(400);
  }
});

filemanager.removeObsoleteFiles = function(idArray){
  idArray.forEach(id=>{
    rimraf(path.resolve(__dirname, '../public/files')+"/"+id+"*", function(err){
      console.log(err);
    }); //Remove any file starting with the filename (in order to include thumbnails too)
  });
}

module.exports = filemanager;