{namespace Page.GameNew}

{template .Main}
	{Call Layout}
		{container CONTENT=.Content}
	{/Call}
{/template}


{template .Content}
	<section class="page" id="gamenew-page">
		<h1>Create a new Game Of Empathy</h1>
		<form method="post" action="/game/new">
			<label>Term
				<input type="text" name="term" id="editArticleTitle" required/>
			</label>
			<label>Start Date
				<input type="datetime-local" name="start_date" value="{moment().format('YYYY-MM-DDTHH:mm')}"/>
			</label>
			<label>End Date
				<input type="datetime-local" name="end_date" value="{moment().add('days',3).format('YYYY-MM-DDTHH:mm')}"/>
			</label>

			<button type="submit">Create</button>
		</form>
	</section>
{/template}