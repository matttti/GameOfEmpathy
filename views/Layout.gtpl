{template Layout}
	<!DOCTYPE html>
	<html>
	<head>
		<title>Game Of Empathy</title>
		<link rel="stylesheet" href="http://code.jquery.com/ui/1.10.1/themes/base/jquery-ui.css">
		<link rel="stylesheet" href="/stylesheets/style.css">
	</head>
	<body>
		<header>
			<div class="wrapper">
				<h1><a href="/" >Game Of Empathy</a></h1>
				<div id="flashs">
					{foreach error in _.errors}
						<div class="flash">{error}</div>
					{/foreach}
					{foreach info in _.infos}
						<div class="flash">{info}</div>
					{/foreach}
				</div>
				{call UserInfo.Main}
			</div>
		</header>

		{if __containers__.HEADING}
			<section id="heading" class="container">
				<div class="wrapper">
					{yield HEADING fallback=noop}
				</div>
			</section>
		{/if}
		<section id="main" class="container">
			<div class="wrapper">
				<section id="content">
					{yield CONTENT fallback=noop}
				</section>
				<section id="sidebar">
					{if !_p.no_rulebox}
						{call RuleBox}
					{/if}
					{if !_p.no_messageboard}
						{call Messageboard}
					{/if}
				</section>
			</div>
		</section>


		<footer>
		</footer>

		{if false || _.dump_json}
			<pre style="text-align:left; height: 200px; overflow:scroll; border: 1px solid; font-size:9px; width:500px;">
				{JSON.stringify(_,null,4)}
			</pre>
		{/if}
		
		<script src="http://code.jquery.com/jquery-1.9.1.min.js"></script>
		<script src="http://code.jquery.com/ui/1.10.1/jquery-ui.js"></script>
		<script src="/javascripts/client.js"></script>
	</body>
	</html>
{/template}

{template UserInfo.Main}
	<div id="loginuserinfobox">
		{if _.login_user}
			<div class="userinfo">
				<span>Hello {_.login_user.username} | {_.login_user.games_played} Games | {_.login_user.overall_score} Points | <a href="/logout">Logout</a></span>
				{if _.login_user.admin}
					&nbsp;| <a href="/game/new">Create Game</a>
				{/if}
			</div>
		{else}
			<div id="dialog-overlay"></div>
			<div class="dialog-form" id="sign-in-form">
				{call UserInfo.SignInDialog}
			</div>
			<div class="dialog-form" id="forgot-password-form">
				{call UserInfo.ForgotPasswordDialog}
			</div>
			<div class="dialog-form" id="sign-up-form">
				{call UserInfo.SignUpDialog}
			</div>
			{if !_p.indexpage}
				<button class="sign-up-trigger primary">Sign up for free</button>
			{/if}
			<button class="sign-in-trigger">Sign In</button>
		{/if}
	</div>
{/template}

{template UserInfo.SignInDialog}

	<h3>Gimme your credentials</h3>
	<a href="#" class="close"></a>

	<p>Log in below to and start guessing.</p>

	<p class="error alert"></p>
	<form method="POST" action="/login">
		<label>
			<input name="username" placeholder="Your Username or Email" autofocus required />
		</label>

		<label>
			<input name="password" placeholder="Your Password" type="password" required/>
		</label>

		<a href="#" id="forgot-password-trigger">Forgot password?</a>
		<button type="submit" class="flexible primary">Sign in</button>

	</form>
{/template}

{template UserInfo.ForgotPasswordDialog}
	<h3>Forgot Your Password?</h3>
	<a href="#" class="close"></a>

	<p>We will send you a new one.</p>

	<p class="error alert"></p>
	<form method="POST" action="/user/request_new_password">
		<label>
			Email
			<input type="email" name="email" placeholder="email" autofocus required />
		</label>

		<button type="submit" class="flexible primary">
			Send Password
		</button>
	</form>
{/template}

{template UserInfo.SignUpDialog}

	<h3>Start playing the Game Of Empathy</h3>
	<a href="#" class="close"></a>

	<p>Register yourself as a new player</p>

	<p class="error alert"></p>
	<form method="POST" action="/user/new">
		<label>
			<input autocomplete="off" name="username" placeholder="Pick a username" autofocus required />
		</label>

		<label>
			<input autocomplete="off" type="email" name="email" placeholder="Your email" required/>
		</label>

		<label>
			<input autocomplete="off" name="password" placeholder="Create a password" type="password" required />
		</label>

		<button type="submit" class="flexible primary">
			Sign up for free
		</button>
	</form>

{/template}

{template RuleBox}
	<section class="howtoplay">
		<h3>How To Play</h3>
		<ul>
			<li>Öffne ein laufendes Spiel.</li>
			<li>Finde <b>10 Begriffe</b>, die zu dem Spielbegriff passen.</li>
			<li>Wenn das Spiel zu Ende ist, wird abgerechnet.</li>
			<li>Jeder Begriff bringt Punkte. Die Anzahl der Punkte entspricht der Anzahl der Spieler, die den Begriff ebenfalls getippt haben.</li>
			<li>Eine hohe Punktzahl bekommst du also, wenn du ein Gespür dafür hast, was die anderen Spieler tippen.</li>
			<li>Fragen? Schreib eine Message oder eine <a href="mailto:info@gameofempathy.com">Mail</a>.</li>
		</ul>
	</section>
{/template}


{template Messageboard}
	<section class="messageboard">

		<h3>Newest Messages</h3>
		<a class="show-all" href="/message">Show all</a>
		{if _.login_user}
			<form id="new-message" method="post" action="/message/new">
				<div class="new-message-title">New Message</div>
				<textarea rows="3" name="text" placeholder="Write a new message"></textarea>
				<div class="buttons">
					<button type="submit">Abschicken</button>
				</div>
			</form>
		{/if}
		{foreach message in _.messages}
			<div class="message">
				<div class="author">{{link_to(message.author)}}</div>
				<div class="text">{message.text}</div>
				<div class="created_at">{moment(message.created_at).fromNow()}
					{if _.login_user && (_.login_user.admin || _.login_user.id == message.author.id)}
						&nbsp;|&nbsp;<a class="delete_message" href="/message/{message.id}/delete">Delete</a>
					{/if}
				</div>
			</div>
		{/foreach}
	</section
{/template}