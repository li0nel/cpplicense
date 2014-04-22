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

var bcrypt = require('bcryptjs'), SALT_WORK_FACTOR = 10;
app.use(logger());

var shortId = require('shortid');

var User     = require('./app/models/user');
var License  = require('./app/models/license');
var App      = require('./app/models/app');
var Activity = require('./app/models/activity');
var Customer = require('./app/models/customer')

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
mongoose.connect('mongodb://heroku_app24418418:746hrmg64nupgnc26m73idg7bb@ds035368.mongolab.com:35368/heroku_app24418418'); // connect to our database

require('./config/passport')(passport); // pass passport for configuration
require('./app/login_routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

//utils
// ============================================================================
function validateEmail(email) { 
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
} 
//crypto
var crypto = require('crypto');
var AESCrypt = {};
AESCrypt.decrypt = function (cryptkey, iv, encryptdata) {
    var decipher = crypto.createDecipheriv('aes-128-cbc', cryptkey, iv);
    return Buffer.concat([
        decipher.update(encryptdata),
        decipher.final()
    ]);
}

AESCrypt.encrypt = function (cryptkey, iv, cleardata) {
    var encipher = crypto.createCipheriv('aes-128-cbc', cryptkey, iv);
    return Buffer.concat([
        encipher.update(cleardata),
        encipher.final()
    ]);
}


//Logging function
var log = function (ip, machineid, operation, userid, appid, licenseid)
{
	var activity = new Activity();
	activity.date = moment();
	activity.ip = ip;
	//activity.geoloc = TODO;
	activity.machineid = machineid;
	activity.operation = operation;
	activity.userid = userid;
	activity.appid = appid;
	activity.licenseid = licenseid;
	
	activity.save(function(err) {
		if (err) console.log(err); 
	});
};

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
	

// route middleware to make sure a user is logged in
function isOwner(req, res, next) {
	if (req.isAuthenticated())
		for (var rep = 0; rep < req.user.apps.length; rep++) {
			if (req.user.apps[rep].id == req.params.appid )
				return next();
		}

	res.redirect('/glogin');
}

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next();
	else
		res.redirect('/glogin');
}

passport.use(new BasicStrategy(function (username, password, done) {
    Customer.findOne({ email : username },function(err,user){
        if(err) { return done(err); }
        if(!user){
            return done(null, false, { message: 'Incorrect username.' });
        }
		bcrypt.compare(password, user.password, function(err, isMatch) {
			if (err) return done(err);
			done(null, user);
		});
    });
}));

passport.use(new BearerStrategy(
  function (token, done) {
    Customer.findOne({ oauthtoken: token }, function (err, user) {
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

app.use("/styles", express.static(__dirname + '/styles'));

app.get('/', function(req, res) {
	res.render('index.ejs');
});

router.route('/apps')

	// create an app and an admin (accessed at POST http://localhost:8080/api/apps)
	.post(isLoggedIn, function(req, res) {
		// need email, password, app description, 
		//check valid email
		if (typeof req.body.description !== 'undefined' && req.body.description !== null) {
			var app = new App();
			app.id = shortId.generate();
			app.ownerid = req.user.userinfo.id;
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
		else
			res.send(400);
	});


router.route('/apps/:appid')

	// get all the licenses (accessed at GET http://localhost:8080/api/users)
	.get(isOwner, function(req, res) {
		App.findOne({id : req.params.appid}, function(err, app) {
			if (err)
				res.send(err);

			if (app.length == 0)
				res.send(404);
			else {
				License.find({appid : app.id, active : true}).sort('-datecreated').exec(function(err, license) {
					if (err)
						res.send(500);
					
					var data = {};
					app = app.toObject();
					app.datecreated = moment(app.datecreated).format("YYYY, MMMM Do");
					data.appinfo = app;

					
					App.find({ownerid : req.user.userinfo.id}, function(err, apps) {
						data.apps = apps;
						data.licenses = [];
						
						for (var rep = 0; rep < license.length; rep++) {
							var doc = license[rep].toObject();
							doc.from = moment(doc.from).format("YYYY-MMM-DD");
							doc.to = moment(doc.to).format("YYYY-MMM-DD");
							doc.datecreated = moment(doc.datecreated).format("YYYY, MMMM Do");
							
							data.licenses.push(doc);
						}

						res.render('dashboard.ejs',data);
					});
				});
			}
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
		&& typeof req.body.to !== 'undefined' && req.body.to !== null
		&& typeof req.body.maxofflinetime !== 'undefined' && req.body.maxofflinetime !== null) {
		
			if (!validateEmail(req.body.email))
				res.send(400,{ error : 'not valid email' });
			else {
				//todo : check dates
				(function(email) {
					var customer = new Customer(); 		// create a new instance of the User model
					customer.email = email;  // set the user email (comes from the request)
					customer.password = shortId.generate();
					customer.id = shortId.generate();
					customer.oauthtoken = shortId.generate()+shortId.generate();
					customer.oauthtokenexpires = moment().add('days', 30);
					customer.forgottoken = shortId.generate()+shortId.generate();
					customer.forgottokenexpires = moment().add('days', 30);
					customer.datecreated = moment();
					customer.active = true; //false; need user to accept invitation
	
					// save the user and check for errors
					customer.save(function(err) {
						if (err && err.code !== 11000) {//Maybe customer already exists, if so continue
							res.send(err); 
						} else {
							if (err && err.code == 11000) {
									Customer.findOne({email : email}, function(err, customer) {
										if (err)
											res.send(err);
										else if (customer.length == 0)
											res.send(500);
										else {
											console.log(customer);

											License.find({email : email, appid : req.params.appid, active : true}, function(err, license) {
												if (err)
													res.send(500);
													
												console.log(license);
													
												if (license.length)
													res.send(403, { error : 'user already have a license for this app'});
												else {
													console.log('email = '+email);

													var newlicense = new License();
													newlicense.email = email;
													newlicense.id = shortId.generate();
													newlicense.userid = customer.id;
													newlicense.appid = req.params.appid;
													newlicense.from = moment(req.body.from);
													newlicense.to = moment(req.body.to);
													newlicense.maxofflinetime = req.body.maxofflinetime;
													newlicense.trial = req.body.trial;
													newlicense.datecreated = moment();
													newlicense.active = true;
							
													// save the app and check for errors
													newlicense.save(function(err) {
														if (err)
															res.send(err); // wrong cast
														else
															res.redirect('/apps/'+req.params.appid);//res.json({ message: 'License created, customer invited' });
													});	
												}
											});
										}
									});
							}
							else {
								License.find({userid : customer.id, appid : req.params.appid, active : true}, function(err, license) {
									if (err)
										res.send(500);
										
									if (license.length)
										res.send(403, { error : 'customer already have a license for this app'});
									else {
										var license = new License();
										license.email = email;
										license.id = shortId.generate();
										license.userid = customer.id;
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
												res.redirect('/apps/'+req.params.appid);//res.json({ message: 'License created, customer invited' });
										});	
									}
								});
							}									
						}
					});
				})(req.body.email)
			}
		} else {
			res.send(400);
		}
	})
	
	// get all the licenses (accessed at GET http://localhost:8080/api/users)
	.get(isOwner, function(req, res) {
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
		
		var token = shortId.generate()+shortId.generate();
		Customer.update({email: req.user.email},{oauthtoken:token}, function(err,affected, raw) {
			console.log('%d new oauth token for customer %s', affected, req.user.email);
		});
		var jsonData = {};
		jsonData['access_token'] = token;
		jsonData['token_type'] = 'access_token';
		jsonData['expires_in'] = '3600'; //TODO
		res.send(jsonData);
	});
	
router.route('/apps/:appid/license')

	// get a fresh license, for customers only. 
	// Owner has no point using that service
	.get(passport.authenticate('bearer', { session: false }), function(req, res) {
		if (typeof req.headers['x-license'] !== 'undefined' && req.headers['x-license'] !== null) {
			App.findOne({id : req.params.appid}, function(err, app) {
				if (err)
					res.send(err);
					
				var cryptkey = new Buffer('IdzPaIeJX1U1TO2v');//app.client_secret);
				var iv = new Buffer('2iiub88whiYSBdj0');//app.client_secret);
				
				License.findOne({userid : req.user.id, appid : req.params.appid}, function(err, license) {
					if (err)
						res.send(err);
					else if (license == null) {
						res.send(404);
						return log(request.connection.remoteAddress, '', 'License renewal failed', req.user.email, license.appid, '');
					}
					else if (license.active===false) 
						res.send(403, 'License is deactivated');
					else {
						var json = {};
						var data = new Buffer(req.get('X-License'), 'base64');
						var dec = AESCrypt.decrypt(cryptkey, iv, data);
						json = JSON.parse(dec.toString('utf8').substr(0, dec.toString('utf8').lastIndexOf("}") + 1));

						if (license.appid == json.ApplicationID) {
							res.send(400, 'License sent is not valid');
						}

						//json.ApplicationID = license.applicationid;
						//json.VolumeInfo = license.VolumeInfo;
						if (moment(license.from) > moment())
							json.StartDate = moment(license.from).format("YYYY-MMM-DD HH:mm:ss");
						else
							json.StartDate = moment().format("YYYY-MMM-DD HH:mm:ss");
							
						if (moment().add('hours', license.maxofflinetime) > moment(license.to))
							json.EndDate = moment(license.to).format("YYYY-MMM-DD HH:mm:ss");
						else
							json.EndDate = moment().add('hours', license.maxofflinetime).format("YYYY-MMM-DD HH:mm:ss");

						var data2 = new Buffer(JSON.stringify(json), 'utf8');
						var enc = AESCrypt.encrypt(cryptkey, iv, data2);

						console.log('Issuing new license for user ' + req.user.email + ', VolumeInfo ' + json.VolumeInfo + ' and for ApplicationID ' + json.ApplicationID);

						var jsonData = {};
						jsonData['License'] = enc.toString('base64');
						res.send(jsonData);
						
						return log(req.connection.remoteAddress, json.VolumeInfo, 'License renewal', req.user.email, license.appid, license.id);
					}
				});
			});
		}
		else
			res.send(400, 'Need old license or MachineID');
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
	});
	
router.route('/apps/:appid/licenses/:licenseid/delete')
	// delete the license with this id (accessed at DELETE http://localhost:8080/api/xxxs/:xxx_id)
	.get(isOwner, function(req, res) {
		// use our xxx model to find the xxx we want
//		License.findOne({id : req.params.licenseid, appid : req.params.appid}, function(err, license) {

		License.update({id : req.params.licenseid, appid : req.params.appid}, {active:false}, function(err, numberAffected, rawResponse) {
			//res.send({ rawResponse : rawResponse});
			res.redirect('/apps/'+req.params.appid);//res.json({ message: 'License deleted!' });
		});

//		});
	});
	
	
// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);

