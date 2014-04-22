// config/passport.js

// load all the things we need
var LocalStrategy    = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

// load up the user model
var User       = require('../app/models/user');
var App       = require('../app/models/app');

var shortId = require('shortid');
var moment = require('moment');

// load the auth variables
var configAuth = require('./auth');

module.exports = function(passport) {

	passport.serializeUser(function(user, done) {
	  done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
	  User.findById(id, function(err, user) {
		App.find({ownerid : id}, function(err, app){
			done(err, {userinfo : user, apps : app});
		});
	  });
	});
    
	// code for login (use('local-login', new LocalStategy))
	// code for signup (use('local-signup', new LocalStategy))
	// code for facebook (use('facebook', new FacebookStrategy))
	// code for twitter (use('twitter', new TwitterStrategy))

	// =========================================================================
    // GOOGLE ==================================================================
    // =========================================================================
    passport.use(new GoogleStrategy({

        clientID        : configAuth.googleAuth.clientID,
        clientSecret    : configAuth.googleAuth.clientSecret,
        callbackURL     : configAuth.googleAuth.callbackURL
    },
    function(token, refreshToken, profile, done) {

		// make the code asynchronous
		// User.findOne won't fire until we have all our data back from Google
		process.nextTick(function() {
	        // try to find the user based on their google id
	        User.findOne({ 'google_id' : profile.id }, function(err, user) {
	            if (err)
	                return done(err);
					
	            if (user) {
	                // if a user is found, log them in
	                return done(null, user);
	            } else {
	                // if the user isnt in our database, create a new user
	                var newUser          = new User();
										
	                // set all of the relevant information
	                newUser.google_id    = profile.id;
	                newUser.google_token = token;
	                newUser.name  = profile.displayName;
	                newUser.email = profile.emails[0].value; // pull the first email
					newUser.picture = profile._json.picture;
					newUser.id = shortId.generate();
					//newUser.oauthtoken = shortId.generate()+shortId.generate();  //User != Customer
					//newUser.oauthtokenexpires = moment().add('days', 30);
					newUser.datecreated = moment();
					newUser.active = true;

	                // save the user
	                newUser.save(function(err) {
	                    if (err)
	                        throw err;
							
						//Create default app
						var app = new App();
						app.id = shortId.generate();
						app.ownerid = newUser.id;
						app.datecreated = moment();
						app.description = 'My app';
						app.client_secret = (shortId.generate()+shortId.generate()).substr(1,16);
						app.active = true;

						// save the app and check for errors
						app.save(function(err) {
							if (err)
								res.send(err);
							else {
								return done(null, newUser);
							}
						});
	                });
	            }
	        });
	    });
    }));
};
