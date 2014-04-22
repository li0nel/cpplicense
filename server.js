// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express'); 		// call express
var app        = express(); 				// define our app using express
var bodyParser = require('body-parser');
var logger = require('morgan');
var moment = require('moment');
var passport = require('passport');
var flash    = require('connect-flash');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var cookieParser = require('cookie-parser');
var BasicStrategy = require('passport-http').BasicStrategy //for basic authentication
var BearerStrategy = require('passport-http-bearer').Strategy; //for bearer token authentication (aka 2-legged OAuth2.0)

app.use(logger());

var shortId = require('shortid');

var User     = require('./app/models/user');
var License  = require('./app/models/license');
var App      = require('./app/models/app');
var Activity = require('./app/models/activity');


// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(cookieParser());
app.use(bodyParser());
// required for passport
app.use(session({ secret: 'ilovescotchscotchyscotchscotchrr' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session



var port = process.env.PORT || 8080; 		// set our port

var mongoose   = require('mongoose');
mongoose.connect('mongodb://localhost/swlicense'); // connect to our database

require('./config/passport')(passport); // pass passport for configuration
require('./app/login_routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

//utils
// ============================================================================
function validateEmail(email) { 
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
} 


// ROUTES FOR OUR API
// =============================================================================
var router = express.Router(); 				// get an instance of the express Router

// middleware to use for all requests
router.use(function(req, res, next) {
	next(); // make sure we go to the next routes and don't stop here
});

		// fetch user and test password verification
		/*if (typeof req.body.email == 'undefined' || req.body.email == null)
			res.send(400, { error : 'wrong email'});
		else {
			User.findOne({ email: req.body.email }, function(err, user) {
				if (err) res.send(err);
				else if (typeof user == 'undefined' || user == null)
					res.send(400, { error : 'wrong email'});
				else if (!user.active) {
					res.send(403, {error:'Account not activated'});
				} else {
					// test for a matching password
					user.comparePassword(req.body.password, function(err, isMatch) {
						if (err) res.send(500, err);

						// check if the password was a match
						if (isMatch) {
							// if there's no lock or failed attempts, just return the user
							//if (!user.loginAttempts && !user.lockUntil) 
							req.session.user = user;
							res.send(user); //todo sanitize output
							// reset attempts and lock info
						} else {
							res.send(400, { error : 'wrong password'});
						}
					});
				}
			});
		}*/
	//});
	
/*router.route('/apps')

	// create an app and an admin (accessed at POST http://localhost:8080/api/apps)
	.post(function(req, res) {
		// need email, password, app description, 
		if (typeof req.body.email !== 'undefined' && req.body.email !== null
		&& typeof req.body.password !== 'undefined' && req.body.password !== null
		&& typeof req.body.description !== 'undefined' && req.body.description !== null) {
		
			//check valid email
			if (!validateEmail(req.body.email))
				res.send(400,{ error : 'not valid email' });
			else if (req.body.password.length < 6) {
				//check valid password
				res.send(400,{ error : 'password must be at leat 6 char long' });
			} else {
				var user = new User();
				user.email = req.body.email;  // set the user email (comes from the request)
				//user.password = req.body.password;
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
								res.json(app);
							}
						});
					}
				});
			}
		}
		else
			res.send(400);
	});
*/

// route middleware to make sure a user is logged in
function isOwner(req, res, next) {
	if (req.isAuthenticated() && req.user.apps[0].id == req.params.appid )
		return next();
	else
		res.redirect('/login');
}

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next();
	else
		res.redirect('/login');
}

passport.use(new BasicStrategy(function (username, password, done) {
    Customers.findOne({ email : username },function(err,user){
        if(err) { return done(err); }
        if(!user){
            return done(null, false, { message: 'Incorrect username.' });
        }
        hash(password, user.salt, function (err, hash) {
            if (err) { return done(err); }
            if (hash == user.password) return done(null, user);
            done(null, false, { message: 'Incorrect password.' });
        });
    });
}));

passport.use(new BearerStrategy(
  function (token, done) {
    Customers.findOne({ access_token: token }, function (err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      return done(null, user, { scope: 'all' });
    });
  }
));

// route for showing the profile page
app.get('/profile', isLoggedIn, function(req, res) {
	res.redirect('/apps/'+req.user.apps[0].id);
});
	
router.route('/apps/:appid')

	// get all the licenses (accessed at GET http://localhost:8080/api/users)
	.get(isOwner, function(req, res) {
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
	.post(isOwner, function(req, res) {
		// need to create new user
		// and new license
		// need email, password + license constraints
		if (typeof req.body.email !== 'undefined' && req.body.email !== null
		&& typeof req.body.from !== 'undefined' && req.body.from !== null
		&& typeof req.body.to !== 'undefined' && req.body.to !== null) {
		
			if (!validateEmail(req.body.email))
				res.send(400,{ error : 'not valid email' });
			else {
				//todo : check dates
				
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
						if (err && err.code == 11000) {
							User.find({email : req.body.email}, function(err, user) {
								if (err)
									res.send(err);
								else if (!user.length)
									res.send(500);
								else {
									License.find({userid : user[0].id, appid : req.params.appid, active : true}, function(err, license) {
										if (err)
											res.send(500);
											
										if (license.length)
											res.send(403, { error : 'user already have a license for this app'});
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
							});
						}
						else {
							License.find({userid : user.id, appid : req.params.appid, active : true}, function(err, license) {
								if (err)
									res.send(500);
									
								if (license.length)
									res.send(403, { error : 'user already have a license for this app'});
								else {
									var license = new License();
									license.id = shortId.generate();
									license.userid = user.id;
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
					}
				});
			}
		} else {
			res.send(400);
		}
	})
	
	// get all the licenses (accessed at GET http://localhost:8080/api/users)
	.get(function(req, res) {
		License.find({appid : req.params.appid, active : true}, function(err, license) {
			if (err)
				res.send(err);
				
			if (!license.length)
				res.send(404);
			else
				res.json(license);
		});
	});
	
router.route('/oauthtoken')
	.post(passport.authenticate('basic', { session: false }), function (req, res) { //Issue token here
		res.header('Content-Type','application/json;charset=UTF-8');
		res.header('Cache-Control','no-store');
		res.header('Pragma', 'no-cache');

//		crypto.randomBytes(25, function(ex, buf) {
//		var token = buf.toString('hex');
			var token = shortId.generate()+shortId.generate();
			Customer.update({email: req.user.email},{access_token:token}, function(err,affected, raw) {
				console.log('%d new oauth token for user %s', affected, req.user.email);
			});
			var jsonData = {};
			jsonData['access_token'] = token;
			jsonData['token_type'] = 'access_token';
			jsonData['expires_in'] = '3600'; //TODO
			res.send(jsonData);
//		});
	});
	
router.route('/apps/:appid/license')

	// get a fresh license, for customers only. 
	// Owner has no point using that service
	.get(passport.authenticate('bearer', { session: false }), function(req, res) {
		//Here check req.headers.X-Grow-License
		
		return License.find({userid : req.user._id, appid : req.params.appid}, function(err, license) {
			if (err)
				res.send(err);
			else if (!license.length)
				res.send(404);
			else if (!license.active) 
				res.send(403, 'License has been deactivated');
			else
				res.json(license);
		});
	})
	
	// update the license with this id (accessed at PUT http://localhost:8080/api/xxxs/:xxx_id)
	.put(isOwner, function(req, res) {
		// use our xxx model to find the xxx we want
		License.findOne({id : req.params.licenseid, appid : req.params.appid}, function(err, license) {

			if (err)
				res.send(err);
			
			if (typeof req.body.from !== 'undefined' && req.body.from !== null)
				license.from = moment(req.body.from);
			if (typeof req.body.to !== 'undefined' && req.body.to !== null)
				license.to = moment(req.body.to);
			if (typeof req.body.maxofflinetime !== 'undefined' && req.body.maxofflinetime !== null)
				license.maxofflinetime = req.body.maxofflinetime;
			if (typeof req.body.trial !== 'undefined' && req.body.trial !== null)
				license.trial = req.body.trial;
			if (typeof req.body.active !== 'undefined' && req.body.active !== null)
				license.active = req.body.active;

			// save the license
			license.save(function(err) {
				if (err)
					res.send(err);

				res.json({ message: 'License updated!' });
			});

		});
	})
	
	// delete the license with this id (accessed at DELETE http://localhost:8080/api/xxxs/:xxx_id)
	.delete(isOwner, function(req, res) {
		// use our xxx model to find the xxx we want
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

