var path = require('path');

var appDir = path.dirname(require.main.filename);

var connection = require(appDir+'/compute/mysql.js');


var module_to_exp = {

   //============= GET actions
   get_profile : function(database_id,callback){
     connection.query("Select * from users where id = ?", [database_id], function(err, rows){
	   //console.log(err);
	   if(!err){
		 var rows_export;		  
		 // rows[0].social = JSON.parse[rows[0].social];
		 if(rows.length > 0){
		  rows[0].password = '';
		  rows[0].status = 'done';
		  rows[0].create_cache = true;
		  rows_export = rows[0];
		 }else{
			 rows_export = [];
		 }
		 //console.log(rows[0]);
		
		 return callback(rows_export);
	   }else{
	     return {status:'error'};
	   }
	 
	 });
   
   },
   get_offers: function(obj, callback){
	     
	   //get all offers on 5km area
	   var location = obj.current_location.split(',');
	   var lat1 = Number(location[0]) - 0.2;
	   var lat2 = Number(location[0]) + 0.2;
	   var lng1 = Number(location[1]) - 0.2;
	   var lng2 = Number(location[1]) + 0.2;
		 
	   if(obj.domain == 'all'){
		  var query_string = "Select * from offers left join company on company.id = offers.owner where " + 
		                             "(" + lat1 + " <= offers.lat AND offers.lat <= " + lat2 + ") AND " +
						             "(" + lng1 + " <= offers.lng AND offers.lng <= " + lng2 + ") order by id desc limit "+ obj.limit1 +", "+ obj.limit2;
	   } else{
		  var query_string = "Select * from offers left join company on company.id = offers.owner where " + 
		                             "(" + lat1 + " <= offers.lat AND offers.lat <= " + lat2 + ") AND " +
						             "(" + lng1 + " <= offers.lng AND offers.lng <= " + lng2 + ") AND company.category = '"+ obj.domain +" ' "+
									 " order by id desc limit "+ obj.limit1 +", "+ obj.limit2;
	   }
		 
	   connection.query(query_string, function(err,rows){
		 //delete all passwords from rows
		 for(a in rows)
		   if(rows[a]) delete rows[a].password; 	 
		 
	     if(!err){
	       callback({status:'done', rows:rows});
	     }else{
	       callback({status:'error'});
	     }
	   });
	   
   },
   
   login: function(obj, callback){
	   connection.query("Select * from users where email = ? and password = ?",[obj.email, obj.password], function(err, rows){
		 if(!err && rows.length == 1){
	       callback({status:'done', id: rows[0].id});
	     }else{
	       callback({status:'error'});
	     }
	   });
   },
   
   
   //================ POST actions
   save_profile : function(obj, callback){
	   
     connection.query("Update users set name = ?, email = ?, description = ?, social = ? where id = ?",[obj.name, obj.email, obj.description, obj.social, obj.id], function(err, rows){
	   if(!err){
	     callback({status:'done'});
	   }else{
	     callback({status:'error'});
	   }
	 });
   
   },
   save_image: function(obj, callback){
     connection.query("Update users set image = ? where id = ?",[obj.image, obj.id],function(err,rows){
	   if(!err){
	     callback({status:'done'});
	   }else{
	     callback({status:'error'});
	   }
	 });
   
   },
   save_coords: function(obj, callback){
	 var json_location = JSON.parse(obj.coords);
	 var coords = json_location.lat + ',' + json_location.lng;
	 connection.query("Update users set current_location = ? where id = ?",[coords, obj.id],function(err, rows){
	   console.log(err);
	   if(!err){
	     callback({status:'done'});
	   }else{
	     callback({status:'error'});
	   } 
	 });
   },
   
   save_travel: function(obj, callback){
	 connection.query("Update users set travelMode = ? where id = ?",[obj.travel, obj.id],function(err,rows){
	   if(!err){
	     callback({status:'done'});
	   }else{
	     callback({status:'error'});
	   }
	 }); 
   },
   
   save_password: function(obj, callback){
	 connection.query("Update users set password = ? where id = ? and password = ?",[obj.new_password, obj.id, obj.old_password], function(err, rows){
		if(!err){
		 if(rows.affectedRows == 0)
	       callback({status:'wrong'}); //wrong password
	     else
	       callback({status:'done'});
	   }else{
	     callback({status:'error'});
	   }
	   console.log(err);
	 });   
   },
   
  going: function(going_id, callback){
	  connection.query("Update company set going = going +1 where id = ?" , going_id, function( err, rows){
	   if(!err){
	     callback({status:'done'});
	   }else{
	     callback({status:'error'});
	   }
	  });
	  
  },
  
  register: function(obj, callback){
	  
	  //prepare JSON for query
	  delete obj.action;
	  delete obj.password_re;
	  
	  obj.travelMode = 'WALKING'; //default travel mode
	  
	  connection.query("Select id from users where email = ?", obj.email, function(err, rows){

		  if(rows.length == 0){
			  connection.query("Insert into users set ?", obj, function(err, rows){
			    if(!err){
				   obj.action = 'register';
				   callback({status:'done', id: rows.insertId});
	            }else{
	               callback({status:'error'});
	             }
			  });
		  }else
			 callback({status : 'wrong'});
		  
	  });

  },
  report: function(obj, callback){
	 connection.query("Update company set reports = reports + 1 where id = ?", obj.where, function(err,rows){
	   if(!err){
	     callback({status:'done'});
	   }else{
	     callback({status:'error'});
	   }
	 });
  }

}

module.exports = module_to_exp;
