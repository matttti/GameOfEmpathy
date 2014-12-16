{namespace Page.MessagesShow}

{template .Main}
	{Call Layout}
		{container CONTENT=.Content}
		{param no_messageboard=true}
	{/Call}
{/template}

{template .Content}
	<div id="page-messageboard" class="page messageboard">
		<h3>Messageboard</h3>
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
	</div>
{/template}