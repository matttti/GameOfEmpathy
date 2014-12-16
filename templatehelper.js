var tools = require('./tools.js');
var moment = require('moment');

tools.update(exports,tools, {moment: moment});

exports.range = function (start, stop, step) {
	if (arguments.length <= 1) {
		stop = start || 0;
		start = 0;
	}
	step = arguments[2] || 1;

	var len = Math.max(Math.ceil((stop - start) / step), 0);
	var idx = 0;
	var range = new Array(len);

	while(idx < len) {
		range[idx++] = start;
		start += step;
	}

	return range;
}

exports.link_to = function(resource, attrs) {
	var modelName = resource.constructor.modelName;

	var href,name;

	switch (modelName) {
		case 'User':
		href='/user/'+resource.id;
		name=resource.username;
		break;
		case 'Game':
		href='/game/' + resource.id;
		name=resource.term;
	}

	return '<a href="' + href + '">'+name+'</a>';
}