var config = require('./config.js');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var ObjectId = mongoose.Schema.Types.ObjectId;
var async = require('async');
var tools = require('./tools.js');
var itemgetter = tools.itemgetter;
var reverseKeyComparator = tools.reverseKeyComparator;
var keyComparator = tools.keyComparator;
var create_index = tools.create_index;
var moment=require('moment');
var mailer=require('./mailer.js');


//mongoose.connect('localhost', 'test');
mongoose.connect(config.mongodb_url);
mongoose.set('debug', true)

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log('mongoose connection established');
});



//User

var UserSchema = mongoose.Schema({
	username: String,
	email: String,
	pw_hash: String,
	send_info_mail: {type: Boolean, default: true},
	admin: { type: Boolean, default: false },
	overall_score: {type: Number, default: 0},
	games_played: {type: Number, default: 0},
	last5games_score: {type: Number, default: 0},
	last5games_count: {type: Number, default: 0},
	gold_medals : {type: Number, default: 0},
	silver_medals : {type: Number, default: 0},
	bronze_medals : {type: Number, default: 0}
	//diamonds : {type: Number, default: 0}
});

UserSchema.index({'overall_score': 1});

UserSchema.virtual('rank').get(function () {
	if(this.username == 'Matti')
		return 'The Rabbit';
  if(this.overall_score > 1000)
  	return 'Champion Empath';
  if(this.overall_score > 200)
  	return 'Empathic Knight';
  if(this.overall_score > 150)
  	return '1st rank Empath';
  if(this.overall_score > 75)
  	return 'Padavan';
  if(this.overall_score > 0)
  	return 'Apprentice';
  return 'Novice';

});

UserSchema.virtual('medalscore').get(function() {
	return this.gold_medals * 3 + this.silver_medals * 2 + this.bronze_medals;
})

UserSchema.methods.validPassword = function(password) {
	return !!password && bcrypt.compareSync(password, this.pw_hash);
}

UserSchema.statics.findByNameOrEmail = function (username, callback) {
	var that = this;
	this.findOne({ username: username }, function (err, user) {
		if(err) return callback(err);
		if(user) return callback(null, user);
		that.findOne({email: username}, callback);
	});
}

UserSchema.statics.register = function(credentials, callback) {
	if(!credentials.username || credentials.username.length < 2) {
		return callback(null, 'Username too short');
	}
	if(!credentials.email || !credentials.email.match(/\S+@\S+\.\S+/)) {
		return callback(null, 'Invalid Email');
	}
	if(!credentials.password || credentials.password.length < 3) {
		return callback(null, 'Password too short (min 3 chars)');
	}

	User.findOne({ username: credentials.username }, function (err, user) {
		//req.next('hehe');
		if (err) {
			return callback(err); 
		}
		if(user) {
			return callback(null, 'Username already exists');
		}

		user = new User({
			username: credentials.username,
			email: credentials.email,
			pw_hash: bcrypt.hashSync(credentials.password, 8)
		});

		user.save(callback);
	});
}

UserSchema.methods.get_security_token = function() {
	return require('crypto').createHash('md5').update(this.pw_hash + 'hallali').digest("hex");
}

UserSchema.methods.check_security_token = function(token) {
	return !!token && token === this.get_security_token();
}

UserSchema.methods.set_new_password = function(new_pw,callback) {
	this.pw_hash = bcrypt.hashSync(new_pw, 8);
	this.save(callback);
}

UserSchema.methods.addGames = function(callback) {
	var that = this;
	if(that.games !== undefined) return callback(null, that.games);
	// Game.find({'players.user': that.id}}, function(err, games) {
	Game.find({'players.user_id': that._id}).sort({start_date: -1}).exec(function(err, games) {
		if(err) return callback(err);
		that.games = games;
		return callback(null, games);
	});
}

var User = mongoose.model('User', UserSchema);
exports.User = User;

//Sub Document Player
var PlayerSchema = mongoose.Schema({
	user_id: { type: ObjectId, ref: 'User' },
	game_score: Number,
	bets: [{word:String, score: Number, _id:false}],
	_id: false 
} );

var Player = mongoose.model('Player', PlayerSchema);
exports.Player = Player;

//Game
var GameSchema = mongoose.Schema({
	term: String,
	_creator: { type: ObjectId, ref: 'User' },
	htmlescape: { type: Boolean, default: true},
	start_date: { type: Date, default: Date.now },
	end_date: { type: Date, default: tools.DateNowPlusDays(3) },
	resolved: {type: Boolean, default:false},
	max_players: {type: Number, default:100},
	players_count: {type: Number, default: 0},
	players: [PlayerSchema],
	results: [{
		word: String,
		hits: Number,
		_id: false
	}]
});

// indexes:
GameSchema.index({'players.user': 1});
GameSchema.index({'start_date': 1});
GameSchema.index({'end_date': 1});

// GameSchema.pre('save', function (next) {
// 	//remove popuplated refs, due to populate bug
// 	this.players = this.players.map(function(player) {
// 		if(typeof player.user == 'object' && player.user.id) {
// 			player.user = player.user.id;
// 		}
// 		return player;
// 	});
// 	next();
// });

GameSchema.statics.create = function(params, callback) {
	if(!params.term.length)
		return callback(null,null,'term too short');

	if(!params.creator)
		return callback(null,null,'creator missing');

	if(!params.start_date || (moment(params.start_date) < moment()))
		params.start_date = moment();

	if(params.end_date && moment(params.end_date) < moment(params.start_date))
		return callback(null,null, 'end date before start date' );

	if(!params.end_date) {
		params.end_date = moment(params.start_date).add('days', 3).format();
	}

	var game = new Game({term: params.term, _creator: params.creator, start_date: params.start_date, end_date: params.end_date});
	game.save(callback);
}

GameSchema.methods.getPlayer = function(user_or_userid) {
	return this.players.filter(function(p) {return p.user_id == user_or_userid || p.user == user_or_userid})[0];
}

GameSchema.methods.populate_users = function(callback) {
	var that=this;
	var user_ids = that.players.map(itemgetter('user_id'));
	User.find().where('_id').in(user_ids).exec(function(err, users) {
		if(err) return callback(err);

		var user_idx = {};
		users.forEach(function(user) {
			user_idx[user.id] = user;
		})

		that.players.forEach(function(player) {
			var user = user_idx[player.user_id];
			if(!user) return callback('user index inconsistency');
			player.user = user;
		});

		return callback(null, users);
	});
}

GameSchema.methods.place_bets = function(user, bets, callback) {
	var that = this;
	if(bets.length != 10)
		return callback('length of bets not equal 10');

	try {
		bets = normalize_bets(bets);
	}
	catch(problems) {
		return callback(problems);
	}

	var player = this.getPlayer(user.id);
	
	if(!player) {		
		var len = this.players.push(new Player({user_id: user.id, user: user, bets: bets}));
		player = this.players[len-1];
	}

	player.bets = bets.map(function(bet) {return {word:bet, score:0}});
	this.increment().save(function(err) {
		return callback(err,bets);
	});

	function normalize_bets(bets) {
		var problems = [];
		var words_idx = {};

		var normalized_bets = bets.map(function(bet, i) {
			if(!bet || bet.match(/^\s*$/)) {
				return '';
			}
			var bet_normalized = normalize_word_german(bet);

			if(bet_normalized == normalize_word_german(that.term)) {
				problems.push({msg: 'equals game phrase', bet:bet, pos: i});
			}

			if(bet.length > 25) {
				problems.push({msg: 'too long', bet:bet, pos: i});
			}

			if(words_idx[bet_normalized]) {
				problems.push({msg: 'duplicate or very close', bet: bet, pos: i});
			}

			words_idx[bet_normalized] = true;
			return bet_normalized;
		});

		if(problems.length)
			throw problems;
		
		return normalized_bets;
	}
}

GameSchema.methods.bets_allowed = function() {
	return !this.resolved && Date.now() < this.end_date;
}

GameSchema.statics.try_resolve_all = function(callback) {
	Game.find({resolved:false, end_date: {$lt: Date.now()}}, function(err, games) {
		if(err) return callback(err);


		async.each(games, function(game,callback) {
			game.resolve(callback);
		}, function(err) {
			if(err) return callback(err);
			return callback(null, games);
		} );
	});
}

GameSchema.methods.try_resolve = function(callback) {
	if(!this.resolved && Date.now() >= this.end_date)
		this.resolve(callback);
	else
		callback(null);
}


////Use this to redo resolve, comment out finalize() in resolve()
// GameSchema.methods.redo_resolve = function(callback) {
// 	var that = this;
// 	that.resolved = false;
// 	that.results = [];
// 	that.players.forEach(function(player) {
// 		player.bets = player.bets.map(function(bet) {
// 			return {word:normalize_word_german(bet.word), score: 0};
// 		});
// 	});
// 	that.save(function(err) {
// 		if(err) return callback(err);
// 		that.resolve(callback);
// 	});
// }

GameSchema.methods.resolve = function(callback) {
	var that = this;
	if(that.resolved)
		return callback('game already resolved');

	that.resolved = true;

	var words = {};
	var bets = [];
	that.players.forEach(function (player) {
		bets = bets.concat(player.bets.filter(function(bet) {return bet.word}));
	});

	bets.forEach(function (bet) {
		var word = bet.word;
		words[word] = words[word] ? words[word]+1 : 1;
	});

	bets.forEach(function (bet) {
		bet.score = words[bet.word];
	});

	that.players.forEach(function (player) {
		player.game_score = player.bets.reduce(function(last,bet) {return last + bet.score;}, 0);
	});

	that.players = that.players.sort(reverseKeyComparator('game_score'))

	for (var word in words) {
		that.results.push({word:word, hits: words[word]})
	}

	that.result = that.results.sort(reverseKeyComparator('hits'));

	that.increment().save(function(err, res) {
		callback(err,res);
		finalize();
	});

	function finalize() {
		async.each(that.players, send_info_mail, function(err){
			console.log('sending info mail finished.', err || '');
		});
		updateScoreAggregations(function(err){
			console.log('update Score Aggregation finished.', err || '');
		});
	}

	function update_statistics(player, callback) {
		//assume that player.user is not populated anymore
		User.findByIdAndUpdate(player.user_id, {$inc: {
			games_played : 1,
			overall_score: player.game_score
		}}).exec(callback);
	}

	function send_info_mail(player, callback) {
		var subject = 'Round "' + that.term + '" has ended. Check your score!';
		var body = 'Du hast sagenhafte ' + player.game_score + ' Punkte erreicht.\n\n';
		body += 'Das Spielergebnis siehst du hier:\nhttp://gameofempathy.com/game/' + that.id;
		body += '\n\nVielen Dank fürs mitspielen!'

		User.findById(player.user_id, function(err, user) {
			if(err) return callback(err);
			mailer.send_info_mail(user, subject, body, callback);
		});
	}
}

function normalize_word_german(word) {
	word = word.replace(/^\s+/,'')
	.replace(/\s+$/,'')
	.toLowerCase()
	.replace(/ä/g,'ae')
	.replace(/ö/g,'oe')
	.replace(/ü/g,'ue')
	.replace(/ß/, 'ss')
	.replace(/\.|\!|\,|'/g,'')
	.replace(/\s+/g,' ');

	/*
		Bilder -> Bild
		Ämter -> Amt
		Achsen -> Achse
		München -> Munch
		Ställe -> Stall
		Autos -> Auto
		Stuss -> Stuss
		Stühle -> Stuhl
		Messer -> Mess
		Klöster -> Klost
		Möhre -> Mohr
		Möhren -> Mohre
	*/
	// var noun = word[0] == word.toLocaleUpperCase()[0] && word.length>=2;
	// if(noun) {
	// 	word = word.replace(/ä/,'a').replace(/ö/,'o').replace(/ü/,'u').replace(/Ä/,'A').replace(/Ö/,'o').replace(/Ü/,'U')
		
	// 	if(word.match(/[^s]s$/)) {
	// 		word = word.replace(/s$/,'');
	// 	}
	// 	else if(word.match(/en?$/)) {
	// 		word = word.replace(/en?$/,'');	
	// 	}
	// 	else if(word.match(/er$/)) {
	// 		word = word.replace(/er$/,'');	
	// 	}
	// }
	return word;
}


var Game = mongoose.model('Game', GameSchema);
exports.Game = Game;

//Message
var MessageSchema = mongoose.Schema({
	text: String,
	author_id: { type: ObjectId, ref: 'User' },
	created_at: {type: Date, default: Date.now}
});

MessageSchema.statics.populate_authors = function(messages, callback) {
	if(! (messages instanceof Array)) 
		messages = [messages];

	var user_ids = messages.map(itemgetter('author_id'));
	User.find().where('_id').in(user_ids).exec(function(err,users) {
		if(err) return callback(err);

		var user_idx = create_index(users);
		messages.forEach(function(message) {
			message.author = user_idx[message.author_id];
		});
		callback(null, users);
	});
};

MessageSchema.methods.populate_author = function(callback) {
	Message.populate_authors([this],callback);
};

var Message = mongoose.model('Message', MessageSchema);
exports.Message = Message;

//Email
var InfoMailSchema = mongoose.Schema({
	to: { type: String },
	subject: {type: String},
	body: {type: String}
});

var InfoMail = mongoose.model('InfoMail', InfoMailSchema);
exports.InfoMail = InfoMail;


//Aggregation
function getLastNGamesScores(n, callback) {
	var o = {};
	o.query = {'resolved' : true};
	n && (o.sort = {'end_date':-1});
	n && (o.limit = n);
	o.map = function () { 
		var last_score = this.players[0].game_score;
		var pos = 1;

		 for(var i = 0; i<this.players.length; ++i) {
		 	if(this.players[i].game_score < last_score)
		 		pos = i+1;
		 	emit(this.players[i].user_id, {count:1, score: this.players[i].game_score, gold:pos ==1 ? 1:0, silver:pos==2?1:0, bronze: pos==3?1:0});
		 	last_score = this.players[i].game_score;
		 };
	};

	o.reduce = function (k, vals) {
		var reduced_val = {count:0, score: 0, gold:0, silver:0, bronze:0};

		for(var i =0; i<vals.length; ++i) {
			reduced_val.count += vals[i].count;
			reduced_val.score += vals[i].score;
			reduced_val.gold += vals[i].gold;
			reduced_val.silver += vals[i].silver;
			reduced_val.bronze += vals[i].bronze;
		}

		return reduced_val;
	};

	Game.mapReduce(o, function(err,results) {
		if(err) return callback(err);
		callback(null, tools.create_index(results, '_id', 'value'));
	});

	//result:  [{_id: <user_id>, value: {count: <games_count>, score: <score_sum> }}, ... ]
}

// function getDiamondAwards(callback) {
// 	var champion_idx = {};
// 	getEmeraldChampionsUserIds(function(err,champions) {
// 		if (err) return callback(err);

// 		var lock_list = Array(5);
// 		for(var i=0; i<champions.length; ++i) {
// 			if(lock_list.indexOf(champions[i]) != -1) {
// 				lock_list.shift();
// 				lock_list.push(undefined);
// 			}
// 			else {
// 				champion_idx[champions[i]] = (champion_idx[champions[i]] || 0) + 1;
// 				lock_list.shift();
// 				lock_list.push(champions[i]);
// 			}
// 		}

// 		callback (null,champion_idx);
// 	})
// }

// function getEmeraldChampionsUserIds(callback) {
// 	var champions = [];
// 	var last_n = 5;

// 	Game.find().query({'resolved' : true}).sort({'end_date':1}).exec(function(err,games) {
// 		if (err) return callback(err);

// 		for(var i = last_n; i <= games.length; ++i) {
// 			champions.push(getChampion( games.slice(i-last_n,i) ));
// 		}

// 		callback(null, champions);
// 	});

// 	function getChampion(games) {
// 		//games has length 5.
// 		var user_idx={};

// 		for(var i =0; i<games.length; ++i) {
// 			for(var j=0; j<games[i].players.length; ++j) {
// 				var player = games[i].players[j];
// 				user_idx[player.user_id] = (user_idx[player.user_id] || 0) + player.game_score;
// 			}
// 		}

// 		var best_user;
// 		var best_score = 0;
// 		for(var key in user_idx) {
// 			if(user_idx[key] == best_score) {
// 				//Tie: No Champion
// 				best_user = null; 
// 			}
// 			else if (user_idx[key] > best_score) {
// 				best_user = key;
// 				best_score = user_idx[key];
// 			}
// 		}
// 		return best_user;
// 	}
// }

function updateScoreAggregations(callback) {
	async.parallel(
		[ getLastNGamesScores.bind(undefined,5), getLastNGamesScores.bind(undefined,0) /*, getDiamondAwards*/, User.find.bind(User,{}) ],
		function(err, result) {
			if(err) return callback(err);
			var last5games_aggr = result[0];
			var overall_aggr = result[1];
			//var diamonds = result[2];
			var users = result[2];

			async.each(users,function(user, callback) {
				overall_obj = overall_aggr[user._id] || {count:0,score:0};
				last5games_obj = last5games_aggr[user._id] || {count:0,score:0};

				user.games_played = overall_obj.count;
				user.overall_score = overall_obj.score;
				user.gold_medals = overall_obj.gold;
				user.silver_medals = overall_obj.silver;
				user.bronze_medals = overall_obj.bronze;
				//user.diamonds = diamonds[user._id] || 0;
				user.last5games_count = last5games_obj.count;
				user.last5games_score = last5games_obj.score;
				user.save(callback);
			},
			callback);
	});
}
exports.updateScoreAggregations = updateScoreAggregations;
