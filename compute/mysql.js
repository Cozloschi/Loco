var mysql = require('mysql');

var connection = mysql.createConnection({ 
  host     : 'localhost',
  user     : 'root',
  password : 'modelismo',
  database : 'loco'
});


module.exports = connection;
