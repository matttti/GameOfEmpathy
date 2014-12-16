$(document).ready(function() {
	$('.countdown').each(function() {
		var that = this;
		var timeout = new Date($(this).attr('data-timeout'));		

		redraw();
		setInterval(redraw, 1000);

		function redraw() {
			var delta_secs = Math.floor(new Date(timeout- Date.now()) / 1000);

			var days = Math.floor(delta_secs / (60*60*24));
			var hours = Math.floor(delta_secs / (60*60)) % 24;
			var minutes = Math.floor(delta_secs / 60) % 60;
			var seconds = delta_secs % 60;

			var str= '';

			if (delta_secs <= 0)
				str = '<span class="finished">finished</span>';
			else {
				str += '<span class="days digit">'+days+'</span><span class="days name">' + (days == 1 ? ' day, ' : ' days, ') + '</span>';
				str += '<span class="hours digit">'+hours+'</span><span class="hours name">' + (hours == 1 ? ' hour, ' : ' hours, ') + '</span>';
				str += '<span class="minutes digit">'+minutes+'</span><span class="minutes name">' + (minutes == 1 ? ' minute, ' : ' minutes, ') + '</span>';
				str += '<span class="seconds digit">'+seconds+'</span><span class="seconds name">' + (seconds == 1 ? ' second' : ' seconds') + '</span>';
			}

			$(that).html(str);
		}
	});


	function flash(type, msg) {
		if(typeof msg == 'object') {
			try {
				msg = JSON.stringify(msg);
			}
			catch(e) {}
		}
		$('<div class="flash ' + type + '">' + msg + '</div>').appendTo($('#flashs'))
		.hide().slideDown().delay(5000).slideUp().delay(1000);
	}

	$('.flash').hide().slideDown().delay(5000).slideUp().delay(1000);

	$('.showform-bet').click(function (e) {
		$('.cancelform-bet').show();
		$('form.bets').show();
		$('.bets.viewer').hide();
	});
	$('.cancelform-bet').click(function (e) {
		$('form.bets').hide();
		$('.bets.viewer').show();
		$('form.bets .problem').remove();
	});

	$('form.bets').submit(function() {
		var form = $(this);
        var data = form.serialize();
        $.post(form.attr('action'), data, function(response) {
        	$('form.bets .problem').remove();
            
            if(response.error) {
            	flash('error', error);
            }
            else {
            	if(response.problems) {
            		response.problems.forEach(function(problem) {
            			$($('form.bets .bet')[problem.pos]).append('<div class="problem">' + problem.msg + '</div>');
            		});
            	}
            	else {
            		var view_html = '';
                var edit_html = '';
            		response.bets.forEach(function(bet,i) {
            			view_html += '<div class="bet"><span class="position">' + (i+1) + '.</span><span class="word">' + (bet || '&nbsp;') + '</span></div>';
                  edit_html += '<div class="bet"><div class="position">' + (i+1)  + '.</div><input class="word" type="text" name="bet_'+(i)+'" value="'+(bet || '')+ '"/></div>';
            		});
                $('.bets.viewer .betlist').html(view_html);
            		$('.bets.editor .betlist').html(edit_html);
            		flash('info', response.info);
            		$('form.bets').hide();
            		$('.bets.viewer').show();
            	}
            }
        });
        return false;           
	});

    var name = $( "#name" ),
      email = $( "#email" ),
      password = $( "#password" ),
      allFields = $( [] ).add( name ).add( email ).add( password ),
      tips = $( ".validateTips" );
 
    function updateTips( t ) {
      tips
        .text( t )
        .addClass( "ui-state-highlight" );
      setTimeout(function() {
        tips.removeClass( "ui-state-highlight", 1500 );
      }, 500 );
    }
 
    function checkLength( o, n, min, max ) {
      if ( o.val().length > max || o.val().length < min ) {
        o.addClass( "ui-state-error" );
        updateTips( "Length of " + n + " must be between " +
          min + " and " + max + "." );
        return false;
      } else {
        return true;
      }
    }
 
    function checkRegexp( o, regexp, n ) {
      if ( !( regexp.test( o.val() ) ) ) {
        o.addClass( "ui-state-error" );
        updateTips( n );
        return false;
      } else {
        return true;
      }
    }

    $( "#sign-in-form2" ).dialog({
      autoOpen: false,
      height: 360,
      width: 350,
      modal: true,
      resizable: false,
      draggable: false,
      buttons: {
        "LOG IN": function() {
          var bValid = true;
          allFields.removeClass( "ui-state-error" );
 
          bValid = bValid && checkLength( name, "username", 1, 16 );
          bValid = bValid && checkLength( password, "password", 1, 16 );
 
          if ( bValid ) {
            $( this ).find('form').submit();
            $( this ).dialog( "close" ).submit();
          }
        }
      },
      close: function() {
        allFields.val( "" ).removeClass( "ui-state-error" );
      }
    });

    $.fn.showDialog = function() {
    	var $this = $(this);
    	$('.dialog-form').hide();
    	$('#dialog-overlay').show();
    	var w = $this.outerWidth();
    	var h = $this.outerHeight();
    	$this.css('margin-left', Math.floor(-w/2) + 'px');
    	$this.css('margin-top', Math.floor(-h/2) + 'px');
    	$this.show();
    }

    function hide_dialogs() {
    	$('.dialog-form').hide();
    	$('#dialog-overlay').hide();
    }

    $('.dialog-form .close').click(hide_dialogs);

    $( ".sign-in-trigger" ).click(function() {
        $( "#sign-in-form" ).showDialog();
    });

    $( ".sign-up-trigger" ).click(function() {
        $( "#sign-up-form" ).showDialog();
    });

    $( ".forgot-password-trigger" ).click(function() {
        $( "#forgot-password-form" ).showDialog();
    });


    $( "#sign-up-form2" ).dialog({
      autoOpen: false,
      height: 450,
      width: 350,
      modal: true,
      resizable: false,
      draggable: false,
      buttons: {
        "Register Now": function() {
          var bValid = true;
          allFields.removeClass( "ui-state-error" );
 
          bValid = bValid && checkLength( name, "username", 3, 16 );
          bValid = bValid && checkLength( email, "email", 6, 80 );
          bValid = bValid && checkLength( password, "password", 5, 16 );
 
          bValid = bValid && checkRegexp( name, /^[a-z]([0-9a-z_])+$/i, "Username may consist of a-z, 0-9, underscores, begin with a letter." );
          bValid = bValid && checkRegexp( email, /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i, "eg. ui@jquery.com" );
          bValid = bValid && checkRegexp( password, /^([0-9a-zA-Z])+$/, "Password field only allow : a-z 0-9" );
 
          if ( bValid ) {
            $( this ).find('form').submit();
            $( this ).dialog( "close" ).submit();
          }
        }
      },
      close: function() {
        allFields.val( "" ).removeClass( "ui-state-error" );
      }
    });


})