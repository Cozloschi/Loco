var path = require('path');

var appDir = path.dirname(require.main.filename);

var connection = require(appDir + '/compute/mysql.js');


function getTime() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return month + "/" + day + " " + hour + ":" + min + ":" + sec;

}

var module_to_exp = {

   //============= GET actions
   get_content: function(obj, callback){
	 //get posts
     connection.query("Select * from company left join offers on company.id = offers.owner where company.id = ?",[obj.id], function(err,rows){
	   if(!err){
		  //console.log(rows);
	     callback({status:'done', rows:rows});
	   }else{
	     callback({status:'error'});
	   }
	 });
	 
   },
   
   login: function(obj, callback){
	 //search for this specific user  
	 connection.query("Select * from company where email = ? and password = ? limit 1",[obj.email, obj.password], function(err ,rows){
		if(rows.length == 1){
			callback({status:'done', image: rows[0].image, id: rows[0].id});
		}else{
			callback({status:'error'});
		}
	 });
	   
   },
   
   search : function(obj, callback){
	  //search for companies with that name
	 obj.val = '%' + obj.val + '%';
     connection.query("Select * from company where name LIKE ? limit 5", obj.val , function(err, rows){
	   if(!err){
		  
		  //remove passwords
		  for(var a in rows)
			  delete rows[a].password;
		  
	     callback({status:'done', rows: rows});
	   }else{
		 console.log(err);
	     callback({status:'error'});
	   }		 
	 });	  
   },

   //================ POST actions
   add_offer : function(obj, callback){
	 console.log(obj);
	 var values = {owner: obj.id, text: obj.offer, date: getTime(), lat: obj.lat, lng: obj.lng};
     connection.query("Insert into offers SET ?",values, function(err, rows){
	   if(!err){
	     callback({status:'done', id:rows.insertId});
	   }else{
	     callback({status:'error'});
	   }
	 });
   
   },
   
   delete_offer: function(obj, callback){
	 connection.query("Delete from offers where id_offer = ? and owner = ?",[obj.delete_id, obj.id], function(err,rows){
	   if(!err){
	     callback({status:'done', id:rows.insertId});
	   }else{
	     callback({status:'error'});
	   }
	 });
   },
   
   profile_picture: function(obj, callback){
	  connection.query("Update company set image = ? where id = ?",[obj.image, obj.id], function(err,rows){
	    if(!err){
	      callback({status:'done'});
	    }else{
	      callback({status:'error'});
	    }
	  });
	   
   },
   
   edit_profile: function(obj, callback){
	   connection.query("Update company set description = ? , name = ? , adress = ? , contact = ? where id = ?",[obj.description, obj.name, obj.adress, obj.contact, obj.id], function(err,rows){
	    console.log(err);
		if(!err){
	      callback({status:'done'});
	    }else{
	      callback({status:'error'});
	    } 
	   });
   },
   
   save_map_marker: function(obj, callback){
	   connection.query("Update company set coords = ? where id = ?",[obj.position, obj.id], function(err,rows){
		 if(!err){
	      callback({status:'done'});
	     }else{
	      callback({status:'error'});
	     } 
	   });
	   
   },
   
   register: function(obj, callback){
	  connection.query("Select * from company where email = ?",[obj.email], function(err,rows){
		 if(!err){
	      if(rows.length > 0){
		    callback({status:'wrong'}); //there is already an account with this email
		    console.log('wrong');
		  }else{
			
            //prepare data for query			
			delete obj.action;
			delete obj.password2;
			
		    //if user can use this email, create the account
			connection.query("Insert into company SET ?", obj, function(err, rows){
			  if(!err)
			   callback({status:'done', id: rows.insertId});
			  else 
			   callback({status:'error'});
	        });
		  }
		 }else{
	      callback({status:'error'});
	     }  
	  });
   }

}

module.exports = module_to_exp;
