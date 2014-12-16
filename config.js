var update = require('./tools.js').update;

var shared_config = {
	auto_resolve_timeout: 60000 * 3, //ms
	send_infomails_timeout: 45000,
	port: 3000,
	cookie_secret: 'lolli lolli ludo fein',
	email: {
		host : "smtp.1und1.de",
		port : "25",
		domain : "smtp.1und1.de",
		from : "info@gameofempathy.com",
		authentication : "login",        
		username : "info@gameofempathy.com",
		password : "hon0lullu"
	}
}

var localconfig = update({
	mongodb_url: 'mongodb://localhost/test',
	redis_options: {
		host: 'localhost',
		port: 6379
	},
	gtpl_config: {
		debug_evals : true,
		debug_undefined_evals : true,
		debug_calls : true,
		embed_eval_errors: false,
		truncate_whitespaces: null,
		escape_evals : true,
		double_bracket_evals: true,
		keep_params: true
	}
}, shared_config);

var remoteconfig = update({
	mongodb_url: 'mongodb://nodejitsu:e2d649fd97db47621fcc2d9b4a8a44fc@linus.mongohq.com:10009/nodejitsudb8172969529',
	redis_options: {
		host: 'nodejitsudb822053139.redis.irstack.com',
		pass: 'nodejitsudb822053139.redis.irstack.com:f327cfe980c971946e80b8e975fbebb4',
		port: 6379,
		db: 'sessions'
	},

	gtpl_config: {
		truncate_whitespaces: 'aggressive',
		escape_evals : true,
		double_bracket_evals: true,
		keep_params: true
	}
}, shared_config);

if(process.env.USE_REMOTECONFIG == 'true') {
	console.log('use remote config');
	module.exports = remoteconfig;
}
else {
	console.log('use local config');
	module.exports = localconfig;
	//module.exports = remoteconfig;
}