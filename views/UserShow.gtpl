{namespace Page.UserShow}

{template .Main}
	{Call Layout}
		{container CONTENT=.Content}
	{/Call}
{/template}


{template .Content}
	<div id="game-overview">
		<div id="new" class="w1of2">
			<h2>{_.user.username}</h2>
			{call Page.Index.GameList root=_.user.games}
		</div>
	</div>
{/template}
