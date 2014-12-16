var moment = require('moment');

var keyComparator = exports.keyComparator = function (key) {
	return function(a,b) {
		if (a[key] > b[key])
			return 1;
		else if (a[key] < b[key])
			return -1;
		return 0;
	};
}

exports.reverseKeyComparator = function(key) {
	var fn = keyComparator(key);
	return function(a,b) {
		return fn(b,a);
	};
}

exports.itemgetter = function(name) {
	return function(obj) {
		return obj[name];
	}
}

exports.create_index = function(arr, keyname, valuefield) {
	keyname = keyname || '_id';

	var idx = {};
	arr.forEach(function(item) {
		idx[item[keyname]] = valuefield ? item[valuefield] : item;
	});
	return idx;
}

exports.update = function(a){
	if(a===null||a===undefined){
		a={};
	}
	for(var i=1; i<arguments.length; i++) {
		var o = arguments[i];
		if(typeof (o) != "undefined" && o !== null){
			for(var k in o){
				a[k]=o[k];
			}
		}
	}
	return a;
}

exports.merge = function() {
	var args = Array.prototype.slice.call(arguments);
	args.unshift(null);
	return exports.update.apply(null,args);
}

exports.format = function(str /*, ... */) {
	var args = Array.prototype.slice.call(arguments,1);
	return str.replace(/{(\d+)}/g, function(match, number) { 
		return typeof args[number] != 'undefined' ? args[number] : match;
	});
}

exports.DateNowPlusDays = function(days) {
	return function() {return Date.now() + days * 24 * 60 * 60 * 1000}
};
