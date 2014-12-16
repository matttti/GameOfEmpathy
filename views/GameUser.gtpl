{namespace Page.GameUser}

{template .Main}
	{Call Layout}
		{container CONTENT=.Content}
	{/Call}
{/template}

{template .Content}
	<div id="page-gameuser">
		<div id="intro">Bets in game "{_.game.term}" for player:</div>		
		<h2>{_.player.user.username}</h2>
		<div id="results">
			<div id="player_results">
				<h4>Game Result</h4>
				<table>
					<tr>
						<th>Word</th>
						<th>Score</th>
					</tr>
					{foreach result in _.player.bets}
						<tr>
							<td>{result.word}</td>
							<td>{result.score}</td>
						</tr>
					{/foreach}
				</table>
			</div>
		</div>
	</div>
{/template}
