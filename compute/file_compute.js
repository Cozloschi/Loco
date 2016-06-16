var fs = require('fs');
var path = require('path');

var publicDir = path.dirname(require.main.filename) + '/public/files/';


var module_to_exp = {
   create_file : function(data, filename, callback){
      fs.writeFile(publicDir + filename, data, function(err){
		 if(err){
            console.log(publicDir + filename);
			callback({status:'error'});
         }else 
            callback({status:'done'});			 
	  });
   },
   get_file : function(filename, callback){
	  fs.readFile(publicDir + filename, 'utf8', function(err, data){
		 if(err)
            callback({status:'error'});
         else{
			callback({status:'done', data: data}); 
		 }		
	  });
	   
   }
}

module.exports = module_to_exp;
