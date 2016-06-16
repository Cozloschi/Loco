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
  
  if(!req.cookies.locoLogin && req.query.action != 'login') res.end(); //user not logged in
  
  if(req.query.action != 'login') req.query.id = req.cookies.locoLogin;
  
  get_requests.handle(req.query, function(response){
    if(req.query.action == 'login' && response.status == 'done'){	  
      res.cookie('locoLogin',response.id, {maxAge:259200000, httpOnly: false, secure:false});
	}
	res.json(response);
	res.end();
  });
});

/* POST */
router.post('/', function(req, res) {
    
  if(!req.cookies.locoLogin && req.body.action != 'register') res.end(); //user not logged in
  
  if(req.body.action != 'register') req.body.id = req.cookies.locoLogin;   
	
  post_requests.handle(req.body, function(response){
	if(req.body.action == 'logout' && response.status == 'done'){
		res.clearCookie('locoLogin', { path: '/' });
	}
    res.json(response);
	res.end();
  });
});


module.exports = router;
