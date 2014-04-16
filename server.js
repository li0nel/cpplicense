// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express'); 		// call express
var app        = express(); 				// define our app using express
var bodyParser = require('body-parser');
var logger = require('morgan');
var moment = require('moment');

app.use(logger());

var shortId = require('shortid');

var User     = require('./app/models/user');
var License  = require('./app/models/license');
var App      = require('./app/models/app');
var Activity = require('./app/models/activity');


// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser());

var port = process.env.PORT || 8080; 		// set our port

var mongoose   = require('mongoose');
mongoose.connect('mongodb://localhost/swlicense'); // connect to our database

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router(); 				// get an instance of the express Router

// middleware to use for all requests
router.use(function(req, res, next) {
	next(); // make sure we go to the next routes and don't stop here
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
	res.send(404);
});
	
router.route('/apps')

	// create an app and an admin (accessed at POST http://localhost:8080/api/apps)
	.post(function(req, res) {
		// need email, password, app description, 
		if (typeof req.body.email !== 'undefined' && req.body.email !== null
		&& typeof req.body.password !== 'undefined' && req.body.password !== null
		&& typeof req.body.description !== 'undefined' && req.body.description !== null) {
		
			//check valid email
			
			//check valid password
			
		
			var user = new User();
			user.email = req.body.email;  // set the user email (comes from the request)
			user.password = req.body.password;
			user.id = shortId.generate();
			user.oauthtoken = shortId.generate()+shortId.generate();
			user.oauthtokenexpires = moment().add('days', 30);
			user.forgottoken = shortId.generate()+shortId.generate();
			user.forgottokenexpires = moment().add('days', 30);
			user.datecreated = moment();
			user.active = false; //need to activate email first

			// save the user and check for errors
			user.save(function(err) {
				if (err)
					res.send(err);
				else {
					var app = new App();
					app.id = shortId.generate();
					app.ownerid = user.id;
					app.datecreated = moment();
					app.description = req.body.description;
					app.client_secret = shortId.generate()+shortId.generate();
					app.active = true;

					// save the app and check for errors
					app.save(function(err) {
						if (err)
							res.send(err);
						else {
							res.json({ message: 'App created!' });
						}
					});
				}
			});
		}
		else
			res.send(400);
	});
	
router.route('/apps/:appid')

	// get all the licenses (accessed at GET http://localhost:8080/api/users)
	.get(function(req, res) {
		App.find({id : req.params.appid}, function(err, app) {
			if (err)
				res.send(err);

			if (!app.length)
				res.send(404);
			else
				res.json(app);
		});
	});

router.route('/apps/:appid/licenses')

	// get all the licenses (accessed at GET http://localhost:8080/api/users)
	.post(function(req, res) {
		// need to create new user
		// and new license
		// need email, password + license constraints
		if (typeof req.body.email !== 'undefined' && req.body.email !== null) {
			var user = new User(); 		// create a new instance of the User model
			user.email = req.body.email;  // set the user email (comes from the request)
			user.password = shortId.generate();
			user.id = shortId.generate();
			user.oauthtoken = shortId.generate()+shortId.generate();
			user.oauthtokenexpires = moment().add('days', 30);
			user.forgottoken = shortId.generate()+shortId.generate();
			user.forgottokenexpires = moment().add('days', 30);
			user.datecreated = moment();
			user.active = false; //need user to accept invitation

			// save the user and check for errors
			user.save(function(err) {
				if (err && err.code !== 11000) {//Maybe user already exists, if so continue
					res.send(err); 
				} else {
					if (err.code == 11000) {
						User.find({email : req.body.email}, function(err, user) {
							if (err)
								res.send(err);
							else if (!user.length)
								res.send(500);
							else {
								var license = new License();
								license.id = shortId.generate();
								license.userid = user[0].id;
								license.appid = req.params.appid;
								license.from = moment(req.body.from);
								license.to = moment(req.body.to);
								license.maxofflinetime = req.body.maxofflinetime;
								license.trial = req.body.trial;
								license.datecreated = moment();
								license.active = true;

								// save the app and check for errors
								license.save(function(err) {
									if (err)
										res.send(err); // wrong cast
									else
										res.json({ message: 'License created, user invited' });
								});
							}
						});
					}
					else {
						var license = new License();
						license.id = shortId.generate();
						license.userid = userid;
						license.appid = req.params.appid;
						license.from = moment(req.body.from);
						license.to = moment(req.body.to);
						license.maxofflinetime = req.body.maxofflinetime;
						license.trial = req.body.trial;
						license.datecreated = moment();
						license.active = true;

						// save the app and check for errors
						license.save(function(err) {
							if (err)
								res.send(err); // wrong cast
							else
								res.json({ message: 'License created, user invited' });
						});
					}									
				}
			});
		}
	});
	
router.route('/apps/:appid/licenses/:licenseid')

	// get all the licenses (accessed at GET http://localhost:8080/api/users)
	.get(function(req, res) {
		License.find({id : req.params.licenseid, appid : req.params.appid, active : true}, function(err, license) {
			if (err)
				res.send(err);
				
			if (!license.length)
				res.send(404);
			else
				res.json(license);
		});
	})
	
	// update the license with this id (accessed at PUT http://localhost:8080/api/bears/:bear_id)
	.put(function(req, res) {

		// use our bear model to find the bear we want
		License.find({id : req.params.licenseid, appid : req.params.appid}, function(err, license) {

			if (err)
				res.send(err);

			license.from = moment(req.body.from);
			license.to = moment(req.body.to);
			license.maxofflinetime = req.body.maxofflinetime;
			license.trial = req.body.trial;
			license.active = req.body.active;

			// save the bear
			license.save(function(err) {
				if (err)
					res.send(err);

				res.json({ message: 'License updated!' });
			});

		});
	})
	
	// delete the license with this id (accessed at DELETE http://localhost:8080/api/bears/:bear_id)
	.delete(function(req, res) {
		// use our bear model to find the bear we want
		License.find({id : req.params.licenseid, appid : req.params.appid}, function(err, license) {

			if (err)
				res.send(err);

			license.active = false;

			// save the license
			license.save(function(err) {
				if (err)
					res.send(err);

				res.json({ message: 'License deleted!' });
			});

		});
	});
	
	
// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);

