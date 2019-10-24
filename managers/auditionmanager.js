var auditionmanager = {}
var filmmanager = require('./filmmanager');
var nodemailer = require('nodemailer');
var htmlencode = require('htmlencode');
var randomkey = require('randomkey');

auditionmanager.create = function(audition,resolve){
    if(audition.filmid){
        var id = Date.now().toString();
        var key = randomkey.generate(1024);
        var sql = "INSERT INTO Auditions (filmid, description, title, form, emails, id, passkey) VALUES (?,?,?,?,?,?)";
        sqlcon.query(sql, [audition.filmid, audition.description, audition.title, audition.form, audition.emails, id, key],function (err, result) {
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
    var sql = `
SELECT
   Auditions.*,
   count(AuditionResponses.auditionid) as response_count,
   Films.slug 
from
   Auditions 
   left join
      AuditionResponses 
      on (Auditions.id = AuditionResponses.auditionid) 
   left JOIN
      Films 
      on (Auditions.filmid = Films.id) 
group by
   Auditions.id 
order by
   Auditions.id`;

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
                    field.response ==  `<p style="margin-top:2px;">`+htmlencode.htmlEncode(field.values[v].label)+`</p>`;
                }
            }
        }
        else if(field.type=="checkbox-group"){
            if(Array.isArray(field.response)){
                list = `<ul style="margin-top:0px">`
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
                        field.response == `<p style="margin-top:2px;">`+htmlencode.htmlEncode(field.values[v].label)+`</p>`;
                        break;
                    }
                }
            }
        }
        else{
            field.response = `<p style="margin-top:2px;">`+htmlencode.htmlEncode(field.response)+`</p>`;
        }
        if(!field.label) field.label=field.name;
        content+=`<h2 style="font-size:16px;margin-top:12px;margin-bottom:0px;">${field.label}</h2>${field.response}`;
    }
    return `<!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>AUFS Audition</title>
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
                            var email =  audition.emails[name].trim();
                            if(email && email.length>0){
                                mailinglist.push(email);
                            }
                        }
                        
                        let mailOptions = {
                            from: '"AUFS Auditions" <auditions@aufilmmaking.co.uk>', // sender address
                            to: mailinglist.join(", "), // list of receivers
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
    var sql = "SELECT * FROM AuditionResponses where auditionid=?";
    sqlcon.query(sql,[auditionid],function (err, result) {
        if (err) resolve(undefined);
        else resolve(result);
    });
}

auditionmanager.verifykey = function(auditionid, key, resolve){
    var sql = "SELECT * FROM Auditions where id=?"
    sqlcon.query(sql,[auditionid],function (err, result) {
        if (err) {
            resolve(false);
        }
        else if(result && result[0] && result[0].passkey==key){
            resolve(true);
        }
        else{
            resolve(false);
        }
    });
}

auditionmanager.getanswertable = function(auditionid, resolve, secret){
    var sql = "SELECT * FROM Auditions where id=?";
    sqlcon.query(sql,[auditionid],function (err, audition) {
        if (err) resolve("No such audition exists");
        else {
            audition = audition[0];
            auditionmanager.getanswers(auditionid,function(answers){
                var headers = new Map();
                if(answers){
                    for(x in answers){
                        if(answers[x].form){
                            try{
                                var fields = JSON.parse(answers[x].form);
                                fields.forEach(field=>{
                                    if(field.label){
                                        headers.set(field.name, field.label);
                                    }
                                });
                            }
                            catch(exception){}
                        }
                    }
                    var html = "";
                    if(secret){
                        html+="<p class='notice'>Please do not share this link with anyone, all information on this page is strictly confidential</p>"
                    }
                    html += "<table class='cell-border compact stripe'><thead><tr>"
                    headers.forEach(function(val,key){
                        html+=`<th data-name="${key}">${htmlencode.htmlEncode(val)}</th>`
                    });
                    html+="</tr></thead>";
                    html+="<tbody>"
                    for(x in answers){
                        if(answers[x].form){
                            try{
                                var fields = JSON.parse(answers[x].form);
                                html+="<tr>"
                                headers.forEach(function(val,key){
                                    var content = "&nbsp;"
                                    for(f in fields){
                                        var field = fields[f]
                                        if(field.name==key || field.name+"[]"==key){
                                            if(field.response && field.response.replace || Array.isArray(field.response)){
                                                if(field.type=="radio-group" || field.type=="select"){
                                                    for(v in field.values){
                                                        if(field.response == field.values[v].value && field.values[v].label){
                                                            content =  htmlencode.htmlEncode(field.values[v].label);
                                                        }
                                                    }
                                                }
                                                else if(field.type=="checkbox-group"){
                                                    if(Array.isArray(field.response)){
                                                        list = `<ul>`
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
                                                        content = list+"</ul>";
                                                    }
                                                    else{
                                                        for(v in field.values){
                                                            if(field.response == field.values[v].value && field.values[v].label){
                                                                content = htmlencode.htmlEncode(field.values[v].label);
                                                                break;
                                                            }
                                                        }
                                                    }
                                                }
                                                else{
                                                    content = htmlencode.htmlEncode(field.response);
                                                }
                                            }
                                            break;
                                        }
                                    }
                                    html+="<td>"+content+"</td>"
                                });
                                html+="</tr>"
                            }
                            catch(exception){}
                        }
                    }
                    html+="</tbody></table>"
                    resolve(html);
                    console.log(html);
                }
                else{
                    return('No answers');
                }
            });
        }
    });
}

module.exports = auditionmanager;