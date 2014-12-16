{namespace Page.Index}

{template .Main}
	{Call Layout}
		{container CONTENT=.Content}
		{container HEADING=.Heading}
		{param indexpage=true}
	{/Call}
{/template}


{template .Heading}
	{if !_.login_user}
		{call .NewUserBanner}
	{/if}	
{/template}

{template .Content}
	<div id="game-overview" class="page">
		<section class="w2of4">
			{if _.new_games.length}
				<div id="new" class="gamelist">
					<h3 class="biglist-title">Current Games You Can Join</h3>
					{call .GameList root=_.new_games}
				</div>				
			{/if}
			{if _.login_user}
				<div id="own" class="gamelist">
					<h3 class="biglist-title">My Games</h3>
					{call .GameList root=_.my_games}
				</div>
			{/if}
			<div id="finished" class="gamelist">
				<h3 class="biglist-title">Old Games</h3>
				{call .GameList root=_.finished_games}
			</div>
		</section>
		<section class="w2of4">
			{if _.last_game}
				<div id="users" class="w1of2 userlist">
					<h3 class="biglist-title">Last Game Ranking "{{link_to(_.last_game)}}"</h3>
					<ul class="biglist">
						{param last_score=0}
						{param last_position=1}
						{foreach player in _.last_game.players}
							<li>
								{if _p.last_score == player.game_score}
									<div class="capture">
										<div class="position">{_p.last_position}.</div>
										<div class="username">{{link_to(player.user)}}</div>
										{call User.MedalList root=player.user}
										<div class="rank">{player.user.rank}</div>
									</div>
								{else}
									<div class="capture">
										<div class="position">{player$index+1}.</div>
										<div class="username">{{link_to(player.user)}}</div>
										{call User.MedalList root=player.user}
										<div class="rank">{player.user.rank}</div>
									</div>
									{param last_score=player.game_score}
									{param last_position=player$index+1}
								{/if}
								<div class="content">
									<span>{player.game_score} Points</span>
								</div>
							</li>
						{/foreach}
					</ul>
				</div>
			{/if}
			{if _.last5games_users}
				<div id="users" class="w1of2 userlist">
					<h3 class="biglist-title">Last 5 Games Ranking</h3>
					<ul class="biglist">
						{foreach user in _.last5games_users}
							<li>
								<div class="capture">
									<div class="position">{user$index+1}.</div>
									<div class="username">{{link_to(user)}}</div>
									{call User.MedalList root=user}
									<div class="rank">{user.rank}</div>
								</div>
								<div class="content">
									<span>{user.last5games_score} Points in {user.last5games_count} Games</span>
								</div>
							</li>
						{/foreach}
					</ul>
				</div>
			{/if}
			{if _.avgscore_users}
				<div id="users" class="w1of2 userlist">
					<h3 class="biglist-title">Medal Table</h3>
					<ul class="biglist">
						{foreach user in _.medalscore_users}
							<li>
								<div class="capture">
									<div class="position">{user$index+1}.</div>
									<div class="username">{{link_to(user)}}</div>
									<div class="rank">{user.rank}</div>
								</div>
								<div class="content">
									{if user.gold_medals}
										<div class="medalcount">{user.gold_medals}x<img class="medal gold" src="images/medal_gold_1.png" /></div class="medalcount">
									{/if}
									{if user.silver_medals}
										<div class="medalcount">{user.silver_medals}x<img class="medal silver" src="images/medal_silver_3.png" /></div class="medalcount">
									{/if}
									{if user.bronze_medals}
										<div class="medalcount">{user.bronze_medals}x<img class="medal bronze" src="images/medal_bronze_2.png" /></div class="medalcount">
									{/if}
									<div class="medalscore">{user.medalscore} pts.</div>
								</div>
							</li>
						{/foreach}
					</ul>
				</div>
			{/if}
			{if _.avgscore_users}
				<div id="users" class="w1of2 userlist">
					<h3 class="biglist-title">Average Score Ranking</h3>
					<ul class="biglist">
						{foreach user in _.avgscore_users}
							<li>
								<div class="capture">
									<div class="position">{user$index+1}.</div>
									<div class="username">{{link_to(user)}}</div>
									{call User.MedalList root=user}
									<div class="rank">{user.rank}</div>
								</div>
								<div class="content">
									<span>Ø {user.avg_score.toFixed(2)} Points in {user.games_played} Games</span>
								</div>
							</li>
						{/foreach}
					</ul>
				</div>
			{/if}
			{if _.users}
				<div id="users" class="w1of2 userlist">
					<h3 class="biglist-title">Overall Ranking</h3>
					<ul class="biglist">
						{foreach user in _.users}
							<li>
								<div class="capture">
									<div class="position">{user$index+1}.</div>
									<div class="username">{{link_to(user)}}</div>
									{call User.MedalList root=user}
									<div class="rank">{user.rank}</div>
								</div>
								<div class="content">
									<span>{user.overall_score} Points in {user.games_played} Games</span>
								</div>
							</li>
						{/foreach}
					</ul>
				</div>
			{/if}
		</section>
	</div>
{/template}

{template User.MedalList}
	<div class="medals">
		{param max_show=_p.max_show || 8}
		{foreach pos in range(_.gold_medals)}
			{if _p.max_show == 0}
				{break}
			{/if}
			<img class="medal gold" style="z-index: {_p.max_show};" src="images/medal_gold_1.png" />
			{param max_show=_p.max_show-1}
		{/foreach}	
		{foreach pos in range(_.silver_medals)}
			{if !_p.max_show}
				{break}
			{/if}
			<img class="medal silver" style="z-index: {_p.max_show};" src="images/medal_silver_3.png" />
			{param max_show=_p.max_show-1}
		{/foreach}	
		{foreach pos in range(_.bronze_medals)}
			{if !_p.max_show}
				{break}
			{/if}
			<img class="medal bronze" style="z-index: {_p.max_show};" src="images/medal_bronze_2.png" />
			{param max_show=_p.max_show-1}
		{/foreach}
	</div>
{/template}

{template .NewUserBanner}
	<section id="new-user-banner">
		<div class="left-side">
			<h1 class="heading">Guess what other people think.</h1>
			<p class="subheading">A Game of words. Test your empathic skills for common sense.</p>
		</div>
		<div class="right-side">
			{call UserInfo.SignUpDialog}
		</div>
	</section>
{/template}

{template .GameList}
	<ul class="biglist">
		{foreach game in _}
			<li>
				<div class="capture">
					{{link_to(game)}}
					{if game.resolved}
						<em> - finished</em>
					{else}
						<em> - {moment(game.end_date).fromNow(true)} left</em>
					{/if}
				</div>
				<div class="content">
					<span>{game.players.length} Players</span>
				</div>
			</li>
		{ifempty}
			<li class="no-game">No Game at the moment</li>
		{/foreach}
	</ul>
{/template}