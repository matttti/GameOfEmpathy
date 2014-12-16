{namespace Page.GameShow}

{template .Main}
	{Call Layout}
		{container CONTENT=.Content}
	{/Call}
{/template}


{template .Content}
	<div id="page-game" class="page">
		<div class="title">
			{if _.game.resolved}
				<em class="intro">Ergebnisse zu:</em>
			{else}
				<em class="intro">Was fällt dir ein zu:</em>
			{/if}
			<h2 class="term">{_.game.term}</h2>
		</div>

		{if _.game.resolved}
			<div class="results">
				{call .ShowResolvedGame}
			</div>
		{else}
			<div class="showbets">
				{call .SetBets}
			</div>
		{/if}
		<dl class="meta">
			<dt>Game started</dt>
			<dd>{moment(_.game.start_date).fromNow()}</dd>
			<dt>Bets placed by</dt>
			<dd>{_.game.players.length} Player(s)</dd>
			{if _.game.resolved}
				<dt>Game ended on</dt>
				<dd>{moment(_.game.end_date).calendar()}</dd>					
			{else}
				<dt>Game ends in</dt>
				<dd class="countdown" data-timeout="{_.game.end_date}"></dd>
			{/if}
		</dl>
		{if !_.game.resolved && _.login_user && _.login_user.admin}
			<a href="/game/{_.game.id}/resolveGame">resolve Game</a>
		{/if}

		{if !_.game.resolved && _.game.players.length} 
			<div id="users" class="userlist">
				<h3 class="biglist-title">These players have placed bets</h3>
				<ul class="biglist">
					{foreach player in _.game.players}
						<li>
							<div class="capture">{{link_to(player.user)}} <span class="rank">{player.user.rank}</span></div>
							<div class="content">
								<span>{player.user.overall_score} Points, {player.user.games_played} Games</span>
							</div>
						</li>
					{/foreach}
				</ul>
			</div>
		{/if}
	</div>
{/template}

{template .SetBets}
	{if _.login_user}
		{param my_player=_.game.getPlayer(_.login_user.id)}
		{if _p.my_player}
			{param my_bets=_p.my_player.bets.map(itemgetter('word'))}
		{else}
			{param my_bets=Array(10)}
		{/if}

		<form class="bets editor" {if _p.my_player}style="display:none;"{/if} method="post" action="/game/{_.game.id}/newBets">
			<div class="betlist">
				{foreach bet in _p.my_bets}
					<div class="bet">
						<div class="position">{bet$index+1}.</div>
						<input class="word" type="text" name="bet_{bet$index}" value="{bet || ''}"/>
					{*<div class="problem">{bet.msg}</div>*}
					</div>
				{/foreach}
			</div>
			<div class="buttons">
				<button class="submit-bet primary" type="submit">Tipps absenden</button>
				<button class="cancelform-bet" style="display:none;" type="reset">Zurücksetzen</button>
			</div>
		</form>
		<div class="bets viewer" {if !_p.my_player}style="display:none";{/if}>
			<em class="intro">Deine eingereichten Tipps. Du kannst sie bis zum Spielende ändern.</em>
			<div class="betlist">
				{foreach bet in _p.my_bets}
					<div class="bet">
						<div class="position">{bet$index+1}.</div>
						<div class="word">{if bet}{bet}{else}&nbsp;{/if}</div>
					</div>
				{/foreach}			
			</div>
			<div class="buttons">
				<button class="showform-bet">Tipps bearbeiten</button>
			</div>
		</div>
	{else}
		<div class="info">Please <a class="sign-up-trigger" href="#">Sign up for free</a> to join this game.<br>
		<a class="sign-in-trigger" href="#">Sign in</a> if you have an account.</div>
	{/if}
{/template}

{template .ShowResolvedGame}
		<div id="word_results" class="result-table">
			<h3>Game Result</h3>
			<table>
				<tr>
					<th>Word</th>
					<th>Hit</th>
				</tr>
				{foreach result in _.game.results}
					<tr>
						<td>{result.word}</td>
						<td>{result.hits}</td>
					</tr>
				{/foreach}
			</table>
		</div>

		<div id="player_results" class="result-table">
			<h3>Player Results</h3>
			<table>
				<tr>
					<th>Place</th>
					<th>Player</th>
					<th>Hit</th>
				</tr>
				{param last_score=Infinity}
				{foreach player in _.game.players}
					<tr>
						<td>
							{if _p.last_score != player.game_score}
								{player$index + 1}
							{/if}
							{param last_score=player.game_score}
						</td>
						<td>{{link_to(player.user)}}  (<a href="/game/{_.game.id}/user/{player.user.id}">bets</a>)</td>
						<td>{player.game_score}</td>
					</tr>
				{/foreach}
			</table>
		</div>

		{if _.login_user}
			{param local_player=_.game.getPlayer(_.login_user.id)}
			{if _p.local_player}
				<div id="user_results" class="result-table">
					<h3>My Results</h3>
					<table>
						<tr>
							<th>Word</th>
							<th>Points</th>
						</tr>
						{foreach bet in _p.local_player.bets}
							<tr>
								<td>{bet.word}</td>
								<td>{bet.score}</td>
							</tr>
						{/foreach}
					</table>
				</div>		
			{/if}
		{/if}
		</div>
	{/template}