var path = require('path');
var express = require('express');
var redis = require('redis');
var router = express.Router();

var appDir = path.dirname(require.main.filename);
var client = redis.createClient();

var database_compute = require(appDir + '/compute/database_compute.js');
var get_requests = require(appDir + '/routes/get_requests.js');
var post_requests = require(appDir + '/routes/post_requests.js');


/* GET  */
router.get('/', function(req, res) {
  
  if(!req.cookies.locoLoginUser && req.query.action != 'login') res.end(); //user not logged in 
 
  if(req.query.action != 'login') req.query.id = req.cookies.locoLoginUser;
 
  console.log(req.query.id);
 
  get_requests.handle(req.query, function(response){

	if(response.create_cache){
        //create redis cache
	    //key = get.action + '-' +get.id
	    console.log('create_cache');
        response.create_cache = false;		
        var key = req.query.action + '-' +req.query.id;	
	    client.set(key, JSON.stringify(response)); 
  	}
	
	//create cookie on user login
    if((req.query.action == 'login')	&& response.status == 'done'){	  
       res.cookie('locoLoginUser',response.id, {maxAge:259200000, httpOnly: false, secure:false});
	}
	
    res.json(response);
	res.end();
  });
});

/* POST */
router.post('/', function(req, res) {
  
  if(!req.cookies.locoLoginUser && req.body.action != 'register') res.end(); //user not logged in
  
  if(req.body.action !== 'register') req.body.id = req.cookies.locoLoginUser;   
  
  post_requests.handle(req.body, function(response){
	  
	 //create cookie if users registers
	if((req.body.action == 'register')	&& response.status == 'done'){	  
       res.cookie('locoLoginUser',response.id, {maxAge:259200000, httpOnly: false, secure:false});
	}
	
	if(req.body.action == 'logout' && response.status == 'done'){
		res.clearCookie('locoLoginUser', { path: '/' });
	}
	 
    res.json(response);
	res.end();
  });
});


module.exports = router;
