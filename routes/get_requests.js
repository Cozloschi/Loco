var path = require('path');
var redis = require('redis');

var appDir = path.dirname(require.main.filename);

var database_compute = require(appDir + '/compute/database_compute.js');
var client = redis.createClient();


/* HANDLER FOR GET REQUESTS */ 
var module_to_exp = { 
       
   handle: function(get, callback){ 

     //redis cache layer for get requests
     //key = get.action + '-' +get.id  
     var key = get.action + '-' +get.id;
	 
	 var ignore_redis_list = ['get_offers']; //actions for redis to ignore

	 client.select(0, function(){ //return to 0 database
		 
		 client.get(key, function(err,reply){

		   if(reply && (ignore_redis_list.indexOf(get.action) < 0) ){
			   
			  reply = JSON.parse(reply);
			  reply.create_cache = false;
			  callback(reply); //return cache from redis  
			  
		   }else{
			  switch(get.action){
		 
			   case 'get_user_profile':
			   
				 database_compute.get_profile(get.id, function(response){
					if(response.status == 'done'){
					  callback(response);
					}else{
					  callback({status:'error'});
					}
				 });
				 
			   break;
			   
			   case 'get_offers':
			   
				 database_compute.get_offers(get, function(response){
					if(response.status == 'done'){
					  
					  //get going users
					  client.select(1, function(){
						//load going users from redis database 1
						
						var a = 0;
						function recursive_query(a){
						  
						  if(typeof response.rows[a] !== 'undefined'){
							client.hgetall("list_going"+ response.rows[a].id_offer, function(error, rows){
							   response.rows[a].going_list = rows;
							   recursive_query(++a);
							});
						  }else{
							callback(response);
						  }
						}
						
						recursive_query(a);
						
					  });
					  
					}else{
					  callback({status:'error'});
					}
					 
				 });
			   
			   break;
			   
			   
			   case 'login':
			     database_compute.login(get, function(response){
			       callback(response);
		         });
			   break;
			   
			   default:
				  return {'status':404};
			   break;
			   
			 }
		   }
		   
		 });
	
	 });
    
   }
}

module.exports = module_to_exp;
