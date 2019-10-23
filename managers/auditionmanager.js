var auditionmanager = {}
var filmmanager = require('./filmmanager');
var nodemailer = require('nodemailer');
var htmlencode = require('htmlencode');

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
function response2html(form){
    var content="";
    for(i in form){
        var field = form[i];

        if(field.type=="hidden")
            continue;
        else if(field.type=="radio-group" || field.type=="select"){
            for(v in field.values){
                if(field.response == field.values[v].value && field.values[v].label){
                    field.response == htmlencode.htmlEncode(field.values[v].label);
                }
            }
        }
        else if(field.type=="checkbox-group"){
            if(Array.isArray(field.response)){
                list = "<ul>"
                for(v1 in field.values){
                    for(v2 in field.response){
                        if(field.response[v2] == field.values[v1].value){
                            if(field.values[v1].label){
                                list+="<li>"+htmlencode.htmlEncode(field.values[v1].label)+"</li>"
                            }
                            else{
                                list+="<li>"+field.values[v1].name+"</li>";
                            }
                        }
                    }
                }
                field.response = list+"</ul>";
            }
            else{
                for(v in field.values){
                    if(field.response == field.values[v].value && field.values[v].label){
                        field.response == htmlencode.htmlEncode(field.values[v].label);break;
                    }
                }
            }
        }
        else{
            field.response = htmlencode.htmlEncode(field.response);
        }
        if(!field.label) field.label=field.name;
        content+=`<h2 style="font-size:16px;margin-top:12px;">${field.label}</h2><p>${field.response}</p>`
    }
    return `<!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>Simple Transactional Email</title>
      </head>
      <body class="">
        ${content}
      </body>
    </html>`
}
auditionmanager.submitanswer = function(auditionid, form, resolve){
    var getform_sql = "SELECT * FROM Auditions where id=?";
    sqlcon.query(getform_sql, [auditionid],function(err,audition){
        if(err){
            resolve({error:"Error when submitting your answer!",details:err});
        }
        else if(audition && audition[0].id==auditionid){
            audition = audition[0];
            var correctform = JSON.parse(audition.form);
            console.log(correctform);
            for(value in form){
                correctform.forEach(field=>{
                    if(field.name==value || field.name+"[]"==value){
                        field.response = form[value];
                    }
                });
                console.log(value+"="+form[value]);
            }
            console.log(correctform);
            var id = Date.now().toString();
            var respond_sql = "INSERT INTO AuditionResponses (auditionid, responseid, form) VALUES (?,?,?)"
            sqlcon.query(respond_sql, [auditionid,id,JSON.stringify(correctform)],function(err,result){
                if(err){
                    resolve({error:"Error when submitting your answer!",details:err});
                }
                else{
                    resolve({error:null});
                    if(audition.emails){
                        audition.emails = JSON.parse(audition.emails);
                        let transporter = nodemailer.createTransport({
                            host: 'mail.aufilmmaking.co.uk',
                            port: 465,
                            secure: true,
                            auth: {
                                user: process.env.AUDITION_EMAIL,
                                pass: process.env.AUDITION_PASSWORD
                            }
                        });
                        var mailinglist=[];
                        for(name in audition.emails){
                            var email =  audition.emails[name];
                            mailinglist.push(email);
                        }
                        let mailOptions = {
                            from: '"AUFS Auditions" <auditions@aufilmmaking.co.uk>', // sender address
                            to: mailinglist, // list of receivers
                            subject: "New audition submission ("+auditionid+")", // Subject line
                            html: response2html(correctform)
                        };
                    
                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                return console.log(error);
                            }
                            console.log('Message %s sent: %s', info.messageId, info.response);
                        });
                    }
                }
            });
        }
        else{
            resolve({error:"Error when retrieving the audition!",details:err});
        }
    });
};
auditionmanager.getanswers = function(auditionid, resolve){
    var sql = "SELECT * FROM AuditionResponses where auditionid=? ORDER by id DESC";
    sqlcon.query(sql,[filmid],function (err, result) {
        if (err) resolve(undefined);
        else resolve(result);
    });
}

module.exports = auditionmanager;