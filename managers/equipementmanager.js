var equipementmanager = {}
const { v4: uuidv4 } = require('uuid');
var mysql = require('mysql');

equipementmanager.createEquipement = function(equipement, resolve){
    equipement.id = uuidv4();
    var sql = "INSERT INTO Equipement (id, name, description, image, category, position) VALUES (?,?,?,?,?,?)";
    sqlcon.query(sql, [equipement.id, equipement.name, equipement.description, equipement.image, equipement.category, equipement.position],function (err, result) {
        if (err) resolve(err, undefined)
        else{
            resolve(undefined, equipement);
        }
    });
}
equipementmanager.editEquipement = async function(id, equipement, resolve){
    var sql = "UPDATE Equipement SET name=?, description=?, image=?, category=?, position=? WHERE id=?";
    sqlcon.query(sql, [equipement.name, equipement.description, equipement.image, equipement.category, equipement.position, id],function (err, result) {
        if (err) resolve(false);
        else{
            resolve(true);
        }
    });
}
equipementmanager.removeEquipement = async function(id, resolve){
    var sql = "DELETE FROM Equipement where id=?";
    sqlcon.query(sql, [id],function (err, result) {
        if (err) resolve(false);
        else{
            resolve(true);
        }
    });
}

equipementmanager.createBooking = function(booking, confirmed){
    if(equipement.name){
        var id = uuidv4();
        var sql = "INSERT INTO EquipementBookings (id, start, end, studentname, studentid, studentemail, filmname, equipementid, confirmed) VALUES (?,?,?,?,?,?,?,?)";
        sqlcon.query(sql, [id, booking.start, booking.end, booking.studentname, booking.studentid, booking.studentemail, booking.filmname, booking.equipementid, confirmed],function (err, result) {
            if (err) return err;
            return id;
        });
    }
}
equipementmanager.editBooking = async function(booking, resolve){
    var sql = "UPDATE EquipementBookings SET start=?, end=? studentname=?, studentid=?, studentemail=?, filmname=?, confirmed=? WHERE id=?";
    sqlcon.query(sql, [booking.start, booking.end, booking.studentname, booking.studentid, booking.studentemail, booking.filmname, booking.confirmed, booking.id],function (err, result) {
        if (err) return err;
        else{
            resolve(true);
        }
    });
}

equipementmanager.getEquipement = async function(resolve){
    var sql = "SELECT * FROM Equipement ORDER BY position ASC";
    sqlcon.query(sql, function(err,result){
        resolve(err, result);
    });
}

equipementmanager.repositionEquipement = async function(repositions, resolve){
    let sqlRepositions = [];
    for (let i = 0; i < repositions.length; i++) {
        sqlRepositions.push('UPDATE Equipement SET position='+ mysql.escape(repositions[i].position) +' WHERE id='+ mysql.escape(repositions[i].id))
    }
    sqlcon.query(sqlRepositions.join(";"), function(err, result){
        if(err) resolve(false);
        else resolve(true);
    })
}

equipementmanager.getEquipementById = async function(id, resolve){
    var sql = "SELECT * FROM Equipement WHERE id=?";
    sqlcon.query(sql, [id], function(err,result){
        resolve(err, result);
    });
}

equipementmanager.getBookings = async function(resolve){
    var sql = "SELECT * FROM EquipementBookings";
    sqlcon.query(sql, function(err,result){
        resolve(err, result);
    });
}


equipementmanager.removeBooking = async function(id, resolve){
    var sql = "DELETE FROM EquipementBookings where id=?";
    sqlcon.query(sql, [id],function (err, result) {
        if (err) resolve(false);
        else{
            resolve(true);
        }
    });
}

module.exports = equipementmanager;