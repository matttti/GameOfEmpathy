var email = require('mailer');
var config = require('./config.js');
var tools = require('./tools.js');
var Model = require('./Model.js');

function send(options, callback) {
  email.send(tools.merge(config.email, options), callback);
}
exports.send= send;

exports.send_info_mail = function(user,subject,body,callback) {
	if(!user.send_info_mail)
		return callback(null,false);

	console.log('send info mail to', user.email);

	body += '\n\nSo long!';
	body += '\n\n\nhttp://gameofempathy.com';
	//body += '\nLogin: tester';
	//body += '\nPasswort: kometenschauer';
	body += '\n\nEigenen Login vergessen? Klick hier: http://gameofempathy.com/login/token/' + user._id + '/' + user.get_security_token();
	body += '\nInfomails abbestellen: http://gameofempathy.com/user/' + user._id + '/nomail';

	send({
		to: user.email,
		subject: subject,
		body: body
	}, callback);
}

// if(config.send_infomails_timeout) {
// 	console.info('Run InfoMail loop every ' + config.send_infomails_timeout + ' ms.');
// 	setInterval(fetch_infomail_and_send, config.send_infomails_timeout);
// }



// function fetch_infomail_and_send() {
// 	Model.InfoMail.findOneAndRemove({},function(err, infomail) {
// 		console.log('send info mail to', infomail.to);
// 		if(err) {
// 			console.error('In send_infomails_timeout: ' + err);
// 			return;
// 		}
// 		send({
// 			to: infomail.to,
// 			subject: infomail.subject,
// 			body: infomail.body
// 		}, function(err) {
// 			if(err) {
// 				console.error('In send_infomails_timeout: ' + err);
// 				return;
// 			}
// 			// try once more
// 			fetch_infomail_and_send();
// 		});
// 	});
// }

