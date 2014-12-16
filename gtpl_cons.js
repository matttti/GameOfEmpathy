var gtpl = require('gtpl');
var wrench = require("wrench");
var fs = require('fs');
var helper = require('./templatehelper.js');
var gtpl_config = require('./config.js').gtpl_config

module.exports =gtpl;

var config = {
	debug_evals : true,
	debug_undefined_evals : true,
	debug_calls : true,
	add_dynamic_script_url: true,
	embed_eval_errors: false,
	truncate_whitespaces: null, //'relaxed' -> ws wrapping textnodes, 'aggressive' -> all linebreaks and wrapping ws inside of textnodes
	escape_evals : true,
	double_bracket_evals: true,
	escape_eval_function : gtpl.escapeHTML,
	string_builder_function_name: 'StringBuilder'
}

gtpl.cons = function(app, directory) {
	if(app.render !== gtpl_render_replacement)
		app.render = gtpl_render_replacement;

	var manager;

	return function() {
		console.log('never call me, plz');
	}

	function render(path, locals_or_callback, callback, use_cache) {
		var locals = locals_or_callback;
		if(typeof locals_or_callback == 'function') {
			locals = undefined;
			callback = locals_or_callback;
		}

		var html,error;
		try {
	
			if(!manager || !use_cache) {
				init_manager();
			}
			html = get_template_fn(path,manager)(locals);
	
		}
		catch (e) {
			error = e
		}

		callback(error,html);
	}

	function init_manager() {
		manager = gtpl.create_template_manager(gtpl_config, [helper]);
		var files = wrench.readdirSyncRecursive(directory);
		files.filter(function(file) {return file.match(/\.gtpl$/);}).forEach(function (file) {
			manager.add(fs.readFileSync(directory + '/' + file, 'utf8'), file);
		})
	}
	
	function gtpl_render_replacement(name, options, fn){
	  var opts = {}
	    , cache = this.cache
	    , engines = this.engines
	    , view;

	  // support callback function as second arg
	  if ('function' == typeof options) {
	    fn = options, options = {};
	  }

	  // merge app.locals
	  merge(opts, this.locals);

	  // merge options._locals
	  if (options._locals) merge(opts, options._locals);

	  // merge options
	  merge(opts, options);

	  // set .cache unless explicitly provided
	  opts.cache = null == opts.cache
	    ? this.enabled('view cache')
	    : opts.cache;

	  // render
	  try {
	    render(name, opts, fn, opts.cache);
	  } catch (err) {
	    fn(err);
	  }
	};
}

function get_template_fn(str, tpl_manager) {
		var fn = tpl_manager;
        var parts = str.split('.');
        try {
            for(var i= 0; i< parts.length; ++i) {
                fn = fn[parts[i]];
            }
        }
        catch(e) {
            if(e instanceof TypeError) {
               throw new gtpl.TemplateUnknownTemplateError('Template not defined: ' + str);
            }
            else {
                throw e;
            }
        }

        return fn;
}

function merge(a, b){
  if (a && b) {
    for (var key in b) {
      a[key] = b[key];
    }
  }
  return a;
};


