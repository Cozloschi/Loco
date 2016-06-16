var path = require('path');
var redis = require('redis');
var appDir = path.dirname(require.main.filename);

var connection = require(appDir + '/compute/mysql.js');

var client = redis.createClient();

//delete from mysql
connection.query("Delete from offers", function(err,rows){
  if(!err)
    console.log('Mysql OK');
  else
    console.log('Mysql Fail');

});


//delete from redis
client.select(1, function(){
	
	//delete all 'going'
	client.flushdb(function( err, ok ){
       if(ok)
		 console.log('Redis OK');
	   else
		 console.log('Redis Fail');
	});
	
});



