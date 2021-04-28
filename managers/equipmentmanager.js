var equipmentmanager = {}
var nodemailer = require('nodemailer');
var escapehtml = require('escape-html');
const {
    v4: uuidv4
} = require('uuid');
var mysql = require('mysql');

equipmentmanager.createEquipment = function(equipment, resolve) {
    equipment.id = uuidv4();
    var sql = "INSERT INTO Equipment (id, name, description, image, category, position) VALUES (?,?,?,?,?,?)";
    sqlcon.query(sql, [equipment.id, equipment.name, equipment.description, equipment.image, equipment.category, equipment.position], function(err, result) {
        if (err) resolve(err, undefined)
        else {
            resolve(undefined, equipment);
        }
    });
}
equipmentmanager.editEquipment = async function(id, equipment, resolve) {
    var sql = "UPDATE Equipment SET name=?, description=?, image=?, category=?, position=? WHERE id=?";
    sqlcon.query(sql, [equipment.name, equipment.description, equipment.image, equipment.category, equipment.position, id], function(err, result) {
        if (err) resolve(false);
        else {
            resolve(true);
        }
    });
}
equipmentmanager.removeEquipment = async function(id, resolve) {
    var sql = "DELETE FROM Equipment where id=?";
    sqlcon.query(sql, [id], function(err, result) {
        if (err) resolve(false);
        else {
            resolve(true);
        }
    });
}

equipmentmanager.createBooking = function(booking, confirmed) {
    if (equipment.name) {
        var id = uuidv4();
        var sql = "INSERT INTO EquipmentBooking (id, start, end, studentname, studentid, studentemail, filmname, equipmentid, confirmed) VALUES (?,?,?,?,?,?,?,?)";
        sqlcon.query(sql, [id, booking.start, booking.end, booking.studentname, booking.studentid, booking.studentemail, booking.filmname, booking.equipmentid, confirmed], function(err, result) {
            if (err) return err;
            return id;
        });
    }
}
equipmentmanager.editBooking = async function(booking, resolve) {
    var sql = "UPDATE EquipmentBooking SET start=?, end=? studentname=?, studentid=?, studentemail=?, filmname=?, confirmed=? WHERE id=?";
    sqlcon.query(sql, [booking.start, booking.end, booking.studentname, booking.studentid, booking.studentemail, booking.filmname, booking.confirmed, booking.id], function(err, result) {
        if (err) return err;
        else {
            resolve(true);
        }
    });
}

equipmentmanager.getEquipment = async function(resolve) {
    var sql = "SELECT * FROM Equipment ORDER BY position ASC";
    sqlcon.query(sql, function(err, result) {
        resolve(err, result);
    });
}

equipmentmanager.repositionEquipment = async function(repositions, resolve) {
    let sqlRepositions = [];
    for (let i = 0; i < repositions.length; i++) {
        sqlRepositions.push('UPDATE Equipment SET position=' + mysql.escape(repositions[i].position) + ' WHERE id=' + mysql.escape(repositions[i].id))
    }
    sqlcon.query(sqlRepositions.join(";"), function(err, result) {
        if (err) resolve(false);
        else resolve(true);
    })
}

equipmentmanager.getEquipmentById = async function(id, resolve) {
    var sql = "SELECT * FROM Equipment WHERE id=?";
    sqlcon.query(sql, [id], function(err, result) {
        resolve(err, result);
    });
}

equipmentmanager.getConfirmedBookings = async function(year, resolve){
    let datequery = makeDateQuery(year);
    var sql = `SELECT EquipmentBooking.id, EquipmentBooking.start, EquipmentBooking.end, EquipmentBooking.equipmentid FROM EquipmentBooking INNER JOIN EquipmentBookingBatch ON EquipmentBooking.bookingbatchid = EquipmentBookingBatch.id ${datequery} WHERE EquipmentBooking.confirmstate=1 OR EquipmentBooking.confirmstate=3`;
    sqlcon.query(sql, function(err, result) {
        if(err) resolve(err, undefined);
        else{
            resolve(undefined,result);
        }
    });
}

function makeDateQuery(year){
    let today = new Date();
    if(year==undefined) year= today.getFullYear(); //if the year isn't specified, assume the current year
    year = Number(year);
    if(new Date(year+"-08-31")>today){
        year--; 
        //If we're before the 31st of August of the current year, then the start date should be earlier
        //Example: On 25/08/2020, current year is 2019-2020, if on 01/09/2020, current year is 2020-2021
    }
    let startdate = new Date(year+"-08-31"); //start date is 31/08 (01/09 in UI)
    let enddate = new Date((year+1)+"-09-01"); //end date is 01/09 (31/08 in UI)
    return `AND EquipmentBookingBatch.start >= ${mysql.escape(startdate)} AND EquipmentBookingBatch.end <= ${mysql.escape(enddate)}`;
}

equipmentmanager.getBookings = async function(active, archived, alltime, year, resolve) {
    let query = "";
    let datequery = makeDateQuery(year);
        if(alltime) datequery = "";
    let activequery = `SELECT EquipmentBooking.* FROM EquipmentBooking INNER JOIN EquipmentBookingBatch ON EquipmentBooking.bookingbatchid = EquipmentBookingBatch.id AND EquipmentBookingBatch.archived=0`;
    let archivedquery = `SELECT EquipmentBooking.* FROM EquipmentBooking INNER JOIN EquipmentBookingBatch ON EquipmentBooking.bookingbatchid = EquipmentBookingBatch.id AND EquipmentBookingBatch.archived=1 ${datequery}`
    if(active && archived && alltime){
        //show everything
        query = `SELECT * FROM EquipmentBooking; 
                 SELECT * FROM EquipmentBookingBatch ORDER BY creationtime DESC`;
    }
    else if(active && archived){
        //only show for the specified year
        query = `${activequery} UNION ${archivedquery};
        SELECT * FROM EquipmentBookingBatch WHERE archived=0 UNION SELECT * FROM EquipmentBookingBatch WHERE archived=1 ${datequery} ORDER BY creationtime DESC`
    }
    else if(active){
        //only select the active elements
        query = `${activequery};
                 SELECT * FROM EquipmentBookingBatch WHERE archived=0 ORDER BY creationtime DESC`;
    }
    else if(archived){
        //only select the archived bookings
        query = `${archivedquery};
            SELECT * FROM EquipmentBookingBatch WHERE archived=1 ${datequery} ORDER BY creationtime DESC`;
    }
    else{
        resolve(undefined, []);
        return;
    }

    sqlcon.query(query, function(err, result) {
        if(err) resolve(err, undefined);
        else{
            let individualbookings = result[0];
            let batchbookings = result[1];
            let batchbookingsmap = {};
            for (let i = 0; i < batchbookings.length; i++) {
                batchbookings[i].bookings = [];
                batchbookingsmap[batchbookings[i].id] = batchbookings[i];
            }
            for (let i = 0; i < individualbookings.length; i++) {
                let batch = batchbookingsmap[individualbookings[i].bookingbatchid];
                if(batch && batch.bookings){
                    batch.bookings.push(individualbookings[i]);
                }
            }
            resolve(undefined, batchbookingsmap)
        }
    });
}

equipmentmanager.getBookingBatch = async function(id, resolve){
    sqlcon.query("SELECT * FROM EquipmentBookingBatch WHERE id=?; SELECT * FROM EquipmentBooking WHERE bookingbatchid=?", [id,id], function(err, result) {
        if(err) resolve(err, undefined);
        else{
            if(result[0] && result[0][0]){
                result[0][0].statustext = makeResponse(result[1], result[0][0].studentemail);
                result[0][0].bookings = result[1];
                resolve(undefined, result[0][0]);
            }
            else{
                resolve(404, undefined);
            }
        }
    });
}
function makeResponse(bookings, studentemail){
    let statusText = "No bookings!";
    if(bookings && bookings.length){
        let ignored = 0;
        let confirmed = 0;
        let edited = 0;
        let denied = 0;
        let total = bookings.length;

        for (let i = 0; i < bookings.length; i++) {
            const booking = bookings[i];
            switch (booking.confirmstate) {
                case 1: confirmed++; break;
                case 2: denied++; break;
                case 3: edited++; break;
                default: ignored++; break;
            }
        }
        if(ignored>0 && confirmed==0 && edited==0 && denied==0){
            statusText= `Your request has not yet been seen by the equipment manager! We'll send an email to <b>${studentemail}</b> once it has been reviewed.`
        }
        else if(ignored>0){
            statusText = `<b>${ignored}</b> of your equipment requests have not yet been reviewed by the Equipment Manager. ${makeSubResponse(confirmed,denied,edited, ignored)}`
        }
        else if(confirmed>0 && ignored==0 && edited==0 && denied==0){
            statusText= `All your equipment requests have been accepted!`
        }
        else if(denied>0 && confirmed==0 && edited==0 && ignored==0){
            statusText = `All your equipment requests have been denied - the equipment manager will have provided further details by email`
        }
        else if(edited>0 && confirmed==0 && ignored==0 && denied==0){
            statusText = `All your equipment requests have been edited - please review these changes in the calendar below. The equipment manager will have provided further details in the update email`
        }
        else if(edited>0 && confirmed>0 && denied>0){
            statusText = `<b>${confirmed}</b> of your booking requests ${pluralizeHaveBeen(confirmed,false)} accepted, <b>${edited}</b> ${pluralizeHaveBeen(edited,false)} modified, and <b>${denied}</b> ${pluralizeHaveBeen(denied,false)} denied.`
        }
        else{
            return makeSubResponse(confirmed, denied, edited,);
        }
    }
    return statusText;
}
function makeSubResponse(confirmed, denied, edited){
    if(confirmed>0 && denied>0 && edited>0){
        return `<b>${confirmed}</b> ${pluralizeHaveBeen(confirmed,true)} accepted, <b>${edited}</b> ${pluralizeHaveBeen(edited,false)} modified, and <b>${denied}</b> ${pluralizeHaveBeen(denied,false)} denied.`
    }
    else if(confirmed>0 && denied>0){
        return `<b>${confirmed}</b> ${pluralizeHaveBeen(denied,true)} accepted and <b>${denied}</b> ${pluralizeHaveBeen(denied,false)} denied.`
    }
    else if(confirmed>0 && edited>0){
        return `<b>${confirmed}</b> ${pluralizeHaveBeen(confirmed,true)} accepted and <b>${edited}</b> ${pluralizeHaveBeen(edited,false)} modified.`
    }
    else if(denied>0 && edited>0){
        return `<b>${edited}</b> ${pluralizeHaveBeen(edited,true)} modified and <b>${denied}</b> ${pluralizeHaveBeen(denied,false)} denied.`
    }
    else if(confirmed>0){
        return `<b>${confirmed}</b> ${pluralizeHaveBeen(confirmed,true)} accepted.`
    }
    else if(edited>0){
        return `<b>${edited}</b> ${pluralizeHaveBeen(edited,true)} modified.`
    }
    else if(denied>0){
        return `<b>${denied}</b> ${pluralizeHaveBeen(denied,true)} denied.`
    }
}
function pluralizeHaveBeen(value, includerequests){
    if(includerequests){
        if(value==1) return "request has been";
        else return "requests have been";
    }
    else{
        if(value==1) return "has been";
        else return "have been";
    }
}

equipmentmanager.removeBookingBatch = async function(id, resolve) {
    var sql = "DELETE FROM EquipmentBookingBatch where id=?";
    sqlcon.query(sql, [id], function(err, result) {
        if (err) resolve(err);
        else {
            resolve();
        }
    });
}
equipmentmanager.archiveBookingBatch = async function(id, archivestate, resolve) {
    sqlcon.query("UPDATE EquipmentBookingBatch SET archived=? WHERE id=? ", [archivestate, id], function(err, result) {
        if (err) resolve(err);
        else {
            resolve();
        }
    });
}

/*confirmstate
0=not confirmed
1=accepted
2=denied
3=edited
*/
equipmentmanager.saveBookingBatch = async function(id, body, resolve){
    let queries = [];
    let acceptIds = [];
    let denyIds = [];
    let undefinedIds = [];
    let earliestStart = new Date(body.bookings[0].start);
    let latestEnd = new Date(body.bookings[0].end);
    for (let i = 0; i < body.bookings.length; i++) {
        const b = body.bookings[i];
        switch (b.confirmstate) {
            case 1:
                acceptIds.push(b.id);
                break;
            case 2:
                denyIds.push(b.id);
                break;
            case 3:
                queries.push(`UPDATE EquipmentBooking SET confirmstate=3, start=${mysql.escape(b.start)}, end=${mysql.escape(b.end)} WHERE id=${mysql.escape(b.id)}`)
                break;
            default:
                undefinedIds.push(b.id);
                break;
        }
        if(i==0){
            earliestStart = new Date(b.start);
            latestEnd = new Date(b.end);
        }
        else{
            let start = new Date(b.start);
            let end = new Date(b.end);
            if(start<earliestStart) earliestStart = start;
            if(end>latestEnd) latestEnd = end;
        }
    }
    if(acceptIds.length>0) queries.push(`UPDATE EquipmentBooking SET confirmstate=1 WHERE id IN (${mysql.escape(acceptIds)})`);
    if(denyIds.length>0) queries.push(`UPDATE EquipmentBooking SET confirmstate=2 WHERE id IN (${mysql.escape(denyIds)})`);
    if(undefinedIds.length>0) queries.push(`UPDATE EquipmentBooking SET confirmstate=0 WHERE id IN (${mysql.escape(undefinedIds)})`);

    queries.push(`UPDATE EquipmentBookingBatch SET archived=${mysql.escape(body.archive)}, start=${mysql.escape(earliestStart)}, end=${mysql.escape(latestEnd)} WHERE id=${mysql.escape(id)}`)
    sqlcon.query(queries.join(";"), function(err, results){
        if(err){
            resolve(err, undefined);
        }
        else{
            //send email
            if(body.sendemail){
                sqlcon.query(`SELECT * From EquipmentBookingBatch WHERE id=?`, [id], function(err2,results2){
                    if(err2){
                        resolve(err2, undefined);
                    }
                    else{
                        resolve();
                        let responses = [];
                        if(results2[0].responses){
                            try{
                                responses = JSON.parse(results2[0].responses);
                            }
                            catch{
                            }
                        }
                        responses.push({
                            date:Date.now(),
                            content:body.message
                        });
                        sqlcon.query(`UPDATE EquipmentBookingBatch SET responses=? WHERE id=?`, [JSON.stringify(responses), id], function(err3,results3){
                            if(err3){
                                console.error(err3);
                            }
                        });
                        emailStudentResponse(body.message, results2[0]);
                    }
                });
            }
            else{
                resolve();
            }
        }
    });
}

equipmentmanager.book = async function(form, admin, resolve) {
    let batchid = uuidv4();
    let bookings = [];
    try {
        bookings = JSON.parse(form.bookingsarray);
    } catch {
        resolve({status:400, message:"Error parsing the equipement booking dates!"});
        return;
    }
    if (bookings.length < 0) {
        resolve({status:400, message:"You must select at least one booking date!"});
        return;
    }
    let earliestStart = new Date();
    let latestEnd = new Date();
    for (let i = 0; i < bookings.length; i++) {
        let b = bookings[i];
        if(i==0){
            earliestStart = new Date(b.start);
            latestEnd = new Date(b.end);
        }
        else{
            let start = new Date(b.start);
            let end = new Date(b.end);
            if(start<earliestStart) earliestStart = start;
            if(end>latestEnd) latestEnd = end;
        }
    }
    var sql = "INSERT INTO EquipmentBookingBatch (id, projectname, projectdescription, studentname, studentid, studentemail, iscommittee, start, end) VALUES (?,?,?,?,?,?,?,?,?)"
    sqlcon.query(sql, [batchid, form.bookingProjectName, form.bookingProjectDescription, form.bookingStudentName, form.bookingStudentId, form.bookingStudentEmail, admin, earliestStart, latestEnd], function(err1, result1) {
        if (err1) {
            resolve({status:500, message:"Failed to add booking request batch to database!", stack:err1});
        }
        else {
            let paramedBookings = [];
            let equipmentIds = [];
            for (let i = 0; i < bookings.length; i++) {
                const b = bookings[i];
                equipmentIds.push(b.equipmentid);
                paramedBookings.push([uuidv4(), b.start, b.end, b.equipmentid, batchid, 0])
                //id, start, end, equipmentid, bookingbatchid, confirmstate=0 (not confirmed)
            }
            let escaped = mysql.escape(paramedBookings);
            sqlcon.query("INSERT INTO EquipmentBooking (id, start, end, equipmentid, bookingbatchid, confirmstate) VALUES " + escaped, function (err2, result2) {
                if (err2)
                    resolve({status:500, message:"Failed to add individual equipment requests to database!", stack:err1});
                else {
                    resolve(undefined, batchid);
                    sqlcon.query("SELECT * FROM `Equipment` WHERE id IN (?)", [equipmentIds], function(err3, result3){
                        if(!err3 && result3 && result3.length>0){
                            for (let i = 0; i < bookings.length; i++) {
                                let equipment = result3.find(e => e.id == bookings[i].equipmentid);
                                if(equipment) bookings[i].equipment = equipment;
                            }
                        }
                        let formhtml = equipmentform2html(form,bookings);
                        emailAUFS(batchid, form, formhtml);
                        emailStudent(batchid, form, formhtml);
                    });
                };
            });
        }
    });
}

let transporter = nodemailer.createTransport({
    host: 'mail.aufilmmaking.co.uk',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EQUIPMENT_EMAIL,
        pass: process.env.EQUIPMENT_PASSWORD
    }
});

function emailAUFS(id, form, formhtml){
    let html = `<!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>AUFS Equipment Request</title>
      </head>
      <body class="">
      <h3><a href="${process.env.URL_START}/admin/equipment">Respond to booking request</a></h3>
      <p>Please find more information about the request below:</p>
      ${formhtml}
      </body>
    </html>`
    let mailOptions = {
        from: {
            name: form.bookingStudentName + " (" + form.bookingStudentId + ")",
            address: form.bookingStudentEmail
        },
        to: 'equipment@aufilmmaking.co.uk', // list of receivers
        subject: "Booking request by " + form.bookingStudentName, // Subject line
        html: html
    };
    transporter.sendMail(mailOptions);
}
function emailStudent(id, form, formhtml){
    url= process.env.URL_START+"/equipment?view="+id;
    let html = `<!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>AUFS Equipment Request</title>
      </head>
      <body class="">
      <h3>Thank you for requesting equipment from AUFS!</h3>
      <p>The society's equipment manager has been contacted to check your booking request. We'll be in contact to confirm everything shortly!</p>
      <p>You can view your booking request from the following link:</p>
      <a href="${url}">${url}</a>
      <p>In the meantime, here's a copy of exactly what you requested:</p>
      ${formhtml}
      </body>
    </html>`

    let mailOptions = {
        from: {
            name: "AUFS Equipment Booking",
            address: "equipment@aufilmmaking.co.uk",
        },
        to: form.bookingStudentEmail, // list of receivers
        subject: `Request confirmation for ${form.bookingProjectName}`, // Subject line
        html: html
    };
    transporter.sendMail(mailOptions);
}

function emailStudentResponse(message, booking){
    url= process.env.URL_START+"/equipment?view="+booking.id;
    let html = `<!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>AUFS Equipment Request</title>
      </head>
      <body>
      <p>${message}</p>
      <hr>
      <p>You can view your booking request from the following link:</p>
        <a href="${url}">${url}</a>
      </body>
    </html>`

    let mailOptions = {
        from: {
            name: "AUFS Equipment Booking",
            address: "equipment@aufilmmaking.co.uk"
        },
        to: booking.studentemail, // list of receivers
        subject: `Request update for ${booking.projectname}`, // Subject line
        html: html
    };
    transporter.sendMail(mailOptions);
}


function equipmentform2html(form, bookings){
    let bookinglist = '';
    for (let i = 0; i < bookings.length; i++) {
        const booking = bookings[i];
        var start = new Date(booking.start);
        var end = new Date(booking.end);
        let startstr = humanizeDate(start);
        let endstr = humanizeDate(end);
        if(start.getHours() == 12) startstr += " (starting at midday)";
        if(end.getHours() == 12) endstr += " (ending at midday)"
        bookinglist+= `<b style="text-decoration:underline;">${escapehtml(booking.equipment.name)}</b><br>
        <b>From:&nbsp;</b><span>${startstr}</span><br>
        <b>To:&nbsp;</b><span>${endstr}</span><br>`
    }
    return `<!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>AUFS Equipment Request</title>
      </head>
      <body class="">
        <h3>Project</h3>
        <b>Name:&nbsp;</b>${escapehtml(form.bookingProjectName)}<br>
        <b>Description:</b><br>
        <p>${escapehtml(form.bookingProjectDescription)}</p>
        <h3>Student</h3>
        <p>
            <b>Name:&nbsp;</b>${escapehtml(form.bookingStudentName)}<br>
            <b>Student ID:&nbsp;</b>${escapehtml(form.bookingStudentId)}<br>
            <b>Email:&nbsp;</b>${escapehtml(form.bookingStudentEmail)}
        </p>
        <h3>Equipment requested:</h3>
        <p>
            ${bookinglist}
        </p><br>
      </body>
    </html>`
}

function humanizeDate(input){
    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    var monthName = monthNames[input.getMonth()]
    var dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    var dayName = dayNames[input.getDay()]
    var date = input.getDate();
    
    var year = input.getFullYear();
    if(year == new Date().getFullYear()) 
        year = "";
    else
        year = ", " + year;
    return `${dayName}, ${monthName} ${date}` + year;
}
module.exports = equipmentmanager;