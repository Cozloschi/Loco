var path = require('path');

var appDir = path.dirname(require.main.filename);

var database_compute = require(appDir + '/compute/database_compute.js'); //database model
var file_compute = require(appDir + '/compute/file_compute.js'); // file model


/* HANDLER FOR POST REQUESTS */ 
var module_to_exp = { 
       
   handle: function(post, callback){
                   
	 switch(post.action){
	 
		case 'add_offer':
		
		  database_compute.add_offer(post, function(response){  
			callback(response);
		  });
		  
		break;
		
		case 'delete_offer':
		
		  database_compute.delete_offer(post, function(response){
			callback(response);
		  });
		
		break;
		
		case 'profile_picture':
		  database_compute.profile_picture(post, function(response){
			callback(response); 
		  });
		break;
		
		case 'edit_profile': //basic informations
		  database_compute.edit_profile(post, function(response){
			callback(response); 
		  });
		break;
		
		case 'save_map_marker':
		  database_compute.save_map_marker(post, function(response){
			callback(response); 
		  });
		break;
		
		//file edit
		case 'create_file':
		  file_compute.create_file(post.data, 'file-' + post.id + '.html', function(response){
			callback(response); 
		  });
		break;
		
		case 'get_file':
		  file_compute.get_file('file-' + post.id + '.html', function(response){
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
		break;
		
		default:
		  return {'status':404};
		break;
	 }
   }
}

module.exports = module_to_exp;
