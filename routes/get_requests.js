var path = require('path');
var redis = require('redis');


var appDir = path.dirname(require.main.filename);

var database_compute = require(appDir + '/compute/database_compute.js');
var file_compute = require(appDir + '/compute/file_compute.js'); // file model
var client = redis.createClient();



/* HANDLER FOR GET REQUESTS */ 
var module_to_exp = { 
       
   handle: function(get, callback){ 

	 switch(get.action){
	    
		case 'get_content':
		  database_compute.get_content(get, function(response){
			
			if(response.status == 'done'){
				
				var rows = response.rows;
				
				var company = rows[0] ? rows[0] : rows;
				
				//delete unnnecessary attributes from company
				delete company.owner;
				delete company.password;
				
				
				var offers = [];
				
				for(var a in rows){
				  if(rows[a].text)
				  {
					//delete unnnecessary attributes from 
					delete rows[a].password;
					offers.push(rows[a]);
				  }
				}
				
				//get html description
				file_compute.get_file('file-' + get.id+ '.html', function(response){
					
					var file = response.status == 'done' ? response.data : '';
                    
					//get going graph data from redis database 2
			        client.select(2, function(){
				      client.hgetall("graph-"+ get.id, function(error, rows){

					    callback({status:'done', company: company, offers:offers, html:file, graph:rows});	
				
				    
			          });
				
						
				    });					
					
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
		
		case 'search':
		   database_compute.search(get, function(response){
			  callback(response); 
		   });
		break;
		
		default:
		  return {'status':404};
		break;
		   
	  }
   }
	   
    
}

module.exports = module_to_exp;
