// (c) 2012 Matthias Schmeißer
// All rights reserved

var config = require('./config.js');
var express = require('express');
//var RedisStore = require('connect-redis')(express);
var MongoStore = require('connect-mongo')(express);
var gtpl = require('./gtpl_cons.js');
var Model = require('./Model.js');
var passport = require('passport');
var flash = require('connect-flash');
var LocalStrategy = require('passport-local').Strategy;
var utils = require("express/node_modules/connect/lib/utils");
var inspect = require('util').inspect;
var app = module.exports = express();
var mailer = require('./mailer.js');
var async = require('async');
var tools= require('./tools.js');

if(config.auto_resolve_timeout) {
	console.info('Setup Auto Resolver every ' + config.auto_resolve_timeout + ' ms.');
	setInterval(function() {
		Model.Game.try_resolve_all(function(err, games) {
			if(err) console.error('In auto_resolve_all: ' + err);
			else console.info('Auto-resolved ' + games.length + ' games.')
	})}, config.auto_resolve_timeout);
}

// Passport Configuration
passport.use('local', new LocalStrategy(
	function(username_or_email, password, done) {
		Model.User.findByNameOrEmail( username_or_email , function (err, user) {
			if (err) {
			 return done(err);
			}
			if (!user) {
				return done(null, false, { message: 'Incorrect username.' });
			}
			if (!user.validPassword(password)) {
				return done(null, false, { message: 'Incorrect password.' });
			}
			return done(null, user);
		});
	}
));

passport.use('security-token', new LocalStrategy(
	{usernameField: 'user_id', passwordField: 'security_token'},
	function(user_id, security_token, done) {
		Model.User.findById( user_id , function (err, user) {
			if (err) {
			 return done(err);
			}
			if (!user) {
				return done(utils.error(403, 'permission denied'));
			}
			if (!user.check_security_token(security_token)) {
				return done(utils.error(403, 'permission denied'));
			}
			return done(null, user);
		});
	}
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	return	Model.User.findById(id,done);
});

// App Configuration

app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'gtpl');
	app.engine('html', gtpl.cons(app, app.get('views')));
	app.use(express.logger('tiny'));
	//app.use(express.basicAuth('tester', 'kometenschauer'));
	app.use(function(req, res, next) {
		req.user = req.remoteUser = undefined; //unset users from basicAuth
		next(null);
	});
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({
		secret: config.cookie_secret, 
		cookie: { maxAge: 24 * 60 * 60 * 1000 * 30},
		store: new MongoStore({
			url: config.mongodb_url
		})
		//store: new RedisStore(config.redis_options)
	}));
	app.use(flash());
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(express.methodOverride());
	app.use(function(req, res, next) {
		if(req.user) {
			req.login_user = req.user;
			delete req.user;
		}
		next(null);
	});
	app.use(require('stylus').middleware({ src: __dirname + '/public' }));
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});


app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
	app.use(express.errorHandler()); 
});

// Routes

function populate_locals(req, res) {
	res.locals.errors= req.flash('error');
	res.locals.infos = req.flash('info');
	res.locals.problems = req.flash('problems');
	res.locals.login_user=req.login_user;
	res.locals.messages=req.messages;
}

function add_messages(req,res, next) {
	Model.Message.find().sort({created_at: 'desc'}).limit(7).exec(function(err,messages) {
		if(err) return next(err);

		Model.Message.populate_authors(messages, function(err, users) {
			if(err) return next(err);
			req.messages = messages;
			next();			
		});
	});
}

function check_admin(req, res, next) {
	if(!req.login_user || req.login_user.admin !== true)
		next(utils.error(403, 'permission denied'));
	else
		next();
}

function check_logged_in(req, res, next) {
	if(!req.login_user)
		next(utils.error(403, 'permission denied'));
	else
		next();
}

function check_is_owner(req, res, next) {
	if(!req.login_user || !req.user || req.user.id != req.login_user.id)
		next(utils.error(403, 'permission denied'));
	else
		next();
}

function check_logged_out(req, res, next) {
	if(req.login_user)
		next(utils.error(403, 'permission denied'));
	else
		next();
}

function all_games(req, res, next) {
	var where = {start_date: {$lt : Date.now()}};
	if(req.login_user && req.login_user.admin) {
		where = {};
	}

	Model.Game.find(where).sort({end_date: 'desc'}).exec(function(err, games) {
		if(err) return next(err);
		req.games = games;
		next();
	});
}

function all_users(req, res, next) {
	Model.User.find().sort({overall_score: 'desc'}).exec(function(err, users) {
		if(err) return next(err);
		req.users = users;
		next();
	});
}

function last_game(req, res, next) {
	Model.Game.findOne({resolved:true}).sort({end_date: 'desc'}).limit(1).exec(function(err, game) {
		game.populate_users(function(err,users) {
			if (err) return next(err);
			req.last_game = game;
			next();
		});
	});
}

app.param('user_id', function(req, res, next, id){
  Model.User.findById(id, function(err, user){
    if (err) {
      next(err);
    } else if (user) {
      req.user = user;
      next();
    } else {
      next(utils.error(404, 'failed to load user'));
    }
  });
});

app.param('game_id', function(req, res, next, id){
	Model.Game.findById(id).exec(function(err, game){
		if (err) return next(err);
		if (!game) return next(utils.error(404, 'failed to load game'));

		game.populate_users(function(err,users) {
			if (err) return next(err);

			game.try_resolve(function(err) {
				if (err) return next(err);
				req.game = game;
				next();
			});
		});
	});
});

app.param('message_id', function(req, res, next, id){
	Model.Message.findById(id).exec(function(err, message){
		if (err) return next(err);
		if (!message) return next(utils.error(404, 'failed to load message'));

		message.populate_author(function(err,users) {
			if (err) return next(err);
			req.message = message;
			next();
		});
	});
});

app.get('/', add_messages, all_games, all_users, last_game, function(req, res){
	var my_games = [];
	if(req.login_user) {
		my_games = req.games.filter(function(game) {
			if (game.getPlayer(req.login_user.id) !== undefined) {
				game.my_game = true;
				return true;
			}
			return false;
		});
	}

	var new_games = req.games.filter(function(game) {
		return !game.resolved && !my_games.some( function(my_game) {
			return game==my_game;
		});
	});

	req.users.forEach(function(user) {
		user.avg_score = user.overall_score / user.games_played;
	});

	var last5games_users = req.users.filter(tools.itemgetter('last5games_count')).sort(tools.reverseKeyComparator('last5games_score'));

	var avgscore_users = req.users.filter(function(i){return i.games_played>=3;}).sort(tools.reverseKeyComparator('avg_score'));
	
	var medalscore_users = req.users.filter(tools.itemgetter('medalscore')).sort(tools.reverseKeyComparator('medalscore'));

	var finished_games = req.games.filter(function(game) {return game.resolved;});

	populate_locals(req, res);
	res.render('Page.Index.Main', {
		games: req.games,
		my_games: my_games,
		new_games: new_games,
		finished_games: finished_games,
		users: req.users,
		last5games_users: last5games_users,
		avgscore_users: avgscore_users,
		medalscore_users: medalscore_users,
		last_game: req.last_game
	});
})


app.get('/game/new', check_admin, add_messages, function(req, res, next) {
	populate_locals(req, res);
	res.render('Page.GameNew.Main', { 
		login: req.login_user
	});
});

app.post('/game/new', check_admin, function(req, res){
	var term = req.param('term');
	var start_date = req.param('start_date');
	var end_date = req.param('end_date');

	Model.Game.create({
		term: req.param('term'),
		creator: req.login_user,
		start_date: start_date,
		end_date: end_date
	}, function(err,game,msg) {
		if(err) return next(err);
		if(!game && msg) {
			req.flash('error', msg);
			return res.redirect('/game/new');
		}

		Model.User.find(function(err, users) {
			async.each(users,send_invite_mail.bind(null,game), function(err) {
				if(err) return next(err);
				req.flash('info', 'New Game created');
				return res.redirect('/');				
			});
		});

	});

	function send_invite_mail(game, user, callback) {
		var subject = 'Neue Runde hat begonnen: "' + game.term + '"';
		var body = 'Spiel mit und setze deine Tipps: ';
		body += 'http://gameofempathy.com/game/' + game.id;

		mailer.send_info_mail(user, subject, body, callback);
	}
});

app.get('/game/:game_id', add_messages, function(req, res, next) {
	populate_locals(req, res);
	res.render('Page.GameShow.Main', {
		game:req.game
	});
});

app.post('/game/:game_id/newBets', check_logged_in, function(req, res, next) {
	if(!req.game.bets_allowed()) {
		return res.json(500, {error: 'game already finished'})
	}

	var my_bets = [];
	for(var i =0; i< 10; ++i) {
		my_bets.push(req.param('bet_' + i));
	}

	req.game.place_bets(req.login_user, my_bets, function(err,bets) {
		if(err && err instanceof Array)  {
			return res.json({ok: true, problems: err});
		}
		if(err) return res.json(500, {error:err});


		return res.json({ok:true, info: 'New Bets added', bets: bets});
	});
});

app.get('/game/:game_id/resolveGame', check_admin, function(req, res, next) {
	req.game.resolve(function(err) {
		if(err)
			return next(err);

		req.flash('info', 'Game resolved');
		return res.redirect('/game/' + req.game.id);
	});
});

app.get('/game/:game_id/user/:user_id', add_messages, function(req, res, next) {
	if(!req.game.resolved && !req.login_user.admin) {
		return next(utils.error(403, 'permission denied'));
	}

	populate_locals(req, res);
	res.render('Page.GameUser.Main', {
		game: req.game,
		player: req.game.getPlayer(req.user.id)
	});
});

app.get('/message', function(req, res, next){
	Model.Message.find().sort({created_at: 'asc'}).exec(function(err,messages) {
		if(err) return next(err);

		Model.Message.populate_authors(messages, function(err, users) {
			if(err) return next(err);
			req.messages = messages.reverse();
			populate_locals(req,res);
			res.render('Page.MessagesShow.Main', {});
		});
	});
});

app.post('/message/new', check_logged_in, function(req, res){
	Model.Message.create({
		text: req.param('text'),
		author_id: req.login_user._id,
		author: req.login_user
	}, function(err,message,msg) {
		if(err) return next(err);
		req.flash('info', 'New Message added');
		return res.redirect('/');
	});
});

app.get('/message/:message_id/delete', check_logged_in, function(req, res, next){
	if(!req.login_user.admin && req.login_user.id !=req.message.author.id)
		return next(utils.error(403,"permission denied"));

	req.message.remove(function(err) {
		if(err) return next(err);
		req.flash('info', 'Message removed');
		return res.redirect('/');
	});
});

app.get('/user/:user_id', add_messages, function(req, res, next) {
	req.user.addGames(function(err, games) {		
		populate_locals(req, res);
		res.render('Page.UserShow.Main', {
			user:req.user
		});
	});
});

app.get('/user/:user_id/nomail', check_is_owner, function(req, res, next) {
	req.user.update({send_info_mail: false},function(err, games) {		
		res.send('Du bekommst keine Mails mehr.');
	});
});


app.post('/login', 
	passport.authenticate('local', {
		successRedirect: '/',
		failureRedirect: '/',
		failureFlash: true })
);

app.get('/login/token/:user_id/:security_token',
	function(req,res,next) {
		//first a little hack
		req.query.user_id = req.params.user_id;
		req.query.security_token = req.params.security_token;
		next();
	},
	passport.authenticate('security-token',  {
		successRedirect: '/',
		failureRedirect: '/',
		failureFlash: true,
		successFlash: 'Welcome!' })
);


app.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
});

app.post('/user/new', function(req, res, next) {
	Model.User.register({
		username:req.param('username'),
		email: req.param('email'),
		password: req.param('password')
	}, function(err, new_user) {
		if (err) return next(err);				

		if(typeof new_user == 'string') { // consistency check failed
			req.flash('error', new_user);
			return res.redirect('/');
		}

		req.login(new_user, function(err) {
			req.flash('info', 'User created');
			if (err) return next(err);				
			return res.redirect('/');
		});
	});
});

app.post('/user/request_new_password', check_logged_out, function(req, res, next) {
	var email = req.param('email');
	if(!email) return next('emailaddress missing');

	Model.User.findOne({email: email}, function(err, user) {
		if (err) return next(err);
		if (!user) return next(utils.error(404, 'no such email adress'));

		var new_pw = Math.random().toString(36).slice(-8);

		user.set_new_password(new_pw, function(err) {
			if (err) return next(err);
			mailer.send({
				'to': user.email,
				'subject': 'Your new Password',
				'body': 'This is your new password: ' + new_pw
			}, function(err) {
				if (err) return next(err);
				req.flash('info', 'Email with new password has been sent');
				return res.redirect('/');
			});
		});
	});
});

app.get('/email_test', function(req,res,next) {
	mailer.send({
		to : "matthias.schmeisser@yahoo.com",
		subject : "Muhaha",
		body: "Hello! This is a test of the node_emailer."
	}, function(err, result){
		if(err){ return next(err); }
		console.log('email send', result);
		return res.send(200, 'email send');
	});
});

app.get('/reaggregate', check_admin, function(req,res,next) {
	Model.updateScoreAggregations(function(err) {
		if(err){ return next(err); }
		return res.send(200, 'reaggregation finished');
	});
});

app.listen(config.port);
console.log("Express server listening on port %s in %s mode", config.port, app.settings.env);

