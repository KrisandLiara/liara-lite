create or replace function delete_chat_session_and_related_data(
  p_session_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer -- grants the function the permissions of the user who defines it, not the user who calls it
as $$
declare
  v_message_ids uuid[];
begin
  -- First, ensure the session belongs to the user making the request.
  if not exists (
    select 1
    from public.chat_sessions cs
    where cs.id = p_session_id and cs.user_id = p_user_id
  ) then
    raise exception 'User does not have permission to delete this chat session or session does not exist.';
  end if;

  -- Collect all message IDs from the session to be deleted.
  select array_agg(ch.id)
  into v_message_ids
  from public.chat_history ch
  where ch.chat_session_id = p_session_id;

  -- If there are any messages, delete their corresponding long-term memories.
  if array_length(v_message_ids, 1) > 0 then
    delete from public.memories m
    where m.source_chat_id = any(v_message_ids);
  end if;

  -- Delete the messages from the chat history.
  delete from public.chat_history ch
  where ch.chat_session_id = p_session_id;

  -- Finally, delete the chat session itself.
  delete from public.chat_sessions cs
  where cs.id = p_session_id;
end;
$$; 