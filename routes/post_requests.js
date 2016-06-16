var path = require('path');
var redis = require('redis');
var socket_client = require('socket.io-client');


var appDir = path.dirname(require.main.filename);
var client = redis.createClient();

var database_compute = require(appDir + '/compute/database_compute.js');


var socket = socket_client.connect('http://127.0.0.4:3200');


/* HANDLER FOR POST REQUESTS */ 
var module_to_exp = { 
       
   handle: function(post, callback){
     //remove cache from redis for this action
     //key = get.action + '-' +post.id  
     var json = {
		'save_user_profile':'get_user_profile',
		'save_user_image':'get_user_profile',
		'save_coords' : 'get_user_profile',
		'save_travel' : 'get_user_profile'
	 };
     var key = json[post.action] + '-' + post.id;

      
     client.select(0, function(){	  
	   client.del(key);
	 });
	 
	 switch(post.action){
	 
		case 'save_user_profile':
		
		  database_compute.save_profile(post, function(response){  
			callback(response);
		  });
		  
		break;
		
		case 'save_user_image':
		
		  database_compute.save_image(post, function(response){
		    callback(response);
		  });
		
		break;
		
		case 'save_coords':
		
		  database_compute.save_coords(post, function(response){
			callback(response); 
		  });

		break;
		
		case 'going':
		
		  //get day
          var d = new Date().getDay() -1;
		
		  client.select(1, function(){ //database 1 for going users
			//console.log('asdada');  
		    //nottify the socketIO server for graph update
            socket.emit('event',{where: post.where, day:d+1});	
          	
		    //nottify the socketIO server for list update
            socket.emit('going',{where: post.where, user: JSON.stringify(post.user_data)});			
	       
			//set data in redis
			client.hset('list_going' + post.post_id, post.id , post.user_data,function(err){
				
			  client.select(2, function(){ //add datapoint to chart, database 2
			  
				 client.hget("graph-" + post.where, d, function(err,rows){
				   if(!err && rows){ // if entry exists, update client
					 client.hincrby("graph-" + post.where, d, 1);
				   }else{
					 client.hset("graph-" + post.where, d, 1); //set new value    
				   }
				 });
				  
			  });
			  
			  //set data in mysql
			  database_compute.going(post.where, function(){ return ;});	
			  if(!err)
			   callback({status:'done'}); //return callback
			  else 
			   callback({status:'error'}); //return callback
			  
			}); 
			
			  //callback({status:'error'});	     
		  });
		  
		break;
		
		case 'report':
		    console.log('was here');
			//nottify the socketIO server for list update
            socket.emit('reported',{where: post.where, user: JSON.stringify(post.user_data)});	
		   
		    database_compute.report(post, function(response){
			  callback(response); 	
			});
		   
		break;
		
		
		case 'save_travel':
		      
		  database_compute.save_travel(post, function(response){
			callback(response); 
		  });
		
		break;
		
		case 'save_password':

		  database_compute.save_password(post, function(response){
			  
			callback(response); 
		  });
		
		break;
		
		
		case 'register':
		  database_compute.register(post, function(response){	  
			callback(response); 
		  });
		break;
		
		case 'logout':
		  callback({status:'done'});
		  //loggin out in requests.js
		break;
		
		default:
		  return {'status':404};
		break;
	 }
   }
}

module.exports = module_to_exp;
