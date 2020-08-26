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

equipmentmanager.getBookings = async function(resolve) {
    var sql = "SELECT * FROM EquipmentBooking; SELECT * FROM EquipmentBookingBatch";
    sqlcon.query(sql, function(err, result) {
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


equipmentmanager.removeBooking = async function(id, resolve) {
    var sql = "DELETE FROM EquipmentBooking where id=?";
    sqlcon.query(sql, [id], function(err, result) {
        if (err) resolve(false);
        else {
            resolve(true);
        }
    });
}


equipmentmanager.book = async function(form, admin, resolve) {
    console.log(form);
    let batchid = uuidv4();
    let bookings = [];
    try {
        bookings = JSON.parse(form.bookingsarray);
    } catch {
        resolve(new Error("Error parsing the equipement booking dates!"));
        return;
    }
    if (bookings.length < 0) {
        resolve(new Error("You must select at least one booking date!"));
        return;
    }
    var sql = "INSERT INTO EquipmentBookingBatch (id, projectname, projectdescription, studentname, studentid, studentemail, iscommittee) VALUES (?,?,?,?,?,?,?)"
    sqlcon.query(sql, [batchid, form.bookingProjectName, form.bookingProjectDescription, form.bookingStudentName, form.bookingStudentId, form.bookingStudentEmail, admin], function(err1, result1) {
        if (err1) {
            resolve(err1);
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
            console.log(escaped);
            sqlcon.query("INSERT INTO EquipmentBooking (id, start, end, equipmentid, bookingbatchid, confirmstate) VALUES " + escaped, function (err2, result2) {
                if (err2) resolve(err2)
                else {
                    resolve(result2);
                    console.log("ids")
                    console.log(equipmentIds);
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
      <h3><a href="${process.env.URL_START}/admin/equipment?request=${id}">Respond to booking request</a></h3>
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
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
    });
}
function emailStudent(id, form, formhtml){
    let html = `<!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>AUFS Equipment Request</title>
      </head>
      <body class="">
      <h3>Thank you for requesting equipment from AUFS!</h3>
      <p>The society's equipment manager has been contacted to confirm your booking request. We'll be in contact to confirm everything shortly!</p>
      <p>In the meantime, here's a copy of exactly what you requested:</p>
      ${formhtml}
      </body>
    </html>`

    let mailOptions = {
        from: {
            name: "AUFS Equipment Booking",
            address: "equipment@aufilmmaking.co.uk"
        },
        to: form.bookingStudentEmail, // list of receivers
        subject: "AUFS Booking request " + form.bookingStudentName, // Subject line
        html: html
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
    });
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