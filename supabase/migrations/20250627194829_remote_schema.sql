drop policy "Allow full access to own chat history" on "public"."chat_history";

drop policy "Users can insert their own chat history" on "public"."chat_history";

drop policy "Users can only see their own chat history" on "public"."chat_history";

drop policy "Users can view their own chat history" on "public"."chat_history";

revoke delete on table "public"."chat_history" from "anon";

revoke insert on table "public"."chat_history" from "anon";

revoke references on table "public"."chat_history" from "anon";

revoke select on table "public"."chat_history" from "anon";

revoke trigger on table "public"."chat_history" from "anon";

revoke truncate on table "public"."chat_history" from "anon";

revoke update on table "public"."chat_history" from "anon";

revoke delete on table "public"."chat_history" from "authenticated";

revoke insert on table "public"."chat_history" from "authenticated";

revoke references on table "public"."chat_history" from "authenticated";

revoke select on table "public"."chat_history" from "authenticated";

revoke trigger on table "public"."chat_history" from "authenticated";

revoke truncate on table "public"."chat_history" from "authenticated";

revoke update on table "public"."chat_history" from "authenticated";

revoke delete on table "public"."chat_history" from "service_role";

revoke insert on table "public"."chat_history" from "service_role";

revoke references on table "public"."chat_history" from "service_role";

revoke select on table "public"."chat_history" from "service_role";

revoke trigger on table "public"."chat_history" from "service_role";

revoke truncate on table "public"."chat_history" from "service_role";

revoke update on table "public"."chat_history" from "service_role";

alter table "public"."chat_history" drop constraint "chat_history_chat_session_id_fkey";

alter table "public"."chat_history" drop constraint "chat_history_role_check";

drop function if exists "public"."get_recent_chat_sessions"(p_user_id uuid, p_limit integer, p_offset integer);

drop function if exists "public"."search_memories"(query_embedding vector, similarity_threshold double precision, match_count integer, filter_tags text[]);

drop function if exists "public"."search_memories"(query_embedding vector, similarity_threshold double precision, match_count integer, p_user_id uuid, filter_tags text[]);

drop function if exists "public"."search_memories"(query_embedding vector, similarity_threshold real, match_count integer, p_tags text[]);

alter table "public"."chat_history" drop constraint "chat_history_pkey";

drop index if exists "public"."chat_history_pkey";

drop index if exists "public"."idx_chat_history_chat_session_id";

drop index if exists "public"."idx_chat_history_created_at";

drop index if exists "public"."idx_chat_history_guest_session_id";

drop index if exists "public"."idx_chat_history_user_id";

drop table "public"."chat_history";

create table "public"."chat_messages" (
    "id" uuid not null default uuid_generate_v4(),
    "chat_session_id" uuid not null,
    "user_id" uuid,
    "guest_session_id" uuid,
    "role" text not null,
    "content" text not null,
    "created_at" timestamp with time zone not null default now(),
    "metadata" jsonb
);


alter table "public"."chat_messages" enable row level security;

CREATE INDEX idx_memories_tags ON public.memories USING gin (tags);

CREATE UNIQUE INDEX chat_history_pkey ON public.chat_messages USING btree (id);

CREATE INDEX idx_chat_history_chat_session_id ON public.chat_messages USING btree (chat_session_id);

CREATE INDEX idx_chat_history_created_at ON public.chat_messages USING btree (created_at);

CREATE INDEX idx_chat_history_guest_session_id ON public.chat_messages USING btree (guest_session_id);

CREATE INDEX idx_chat_history_user_id ON public.chat_messages USING btree (user_id);

alter table "public"."chat_messages" add constraint "chat_history_pkey" PRIMARY KEY using index "chat_history_pkey";

alter table "public"."chat_messages" add constraint "chat_history_chat_session_id_fkey" FOREIGN KEY (chat_session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE not valid;

alter table "public"."chat_messages" validate constraint "chat_history_chat_session_id_fkey";

alter table "public"."chat_messages" add constraint "chat_history_role_check" CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text]))) not valid;

alter table "public"."chat_messages" validate constraint "chat_history_role_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_distinct_tags(p_user_id uuid)
 RETURNS TABLE(tag text)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT DISTINCT unnest(tags) as tag
    FROM memories
    WHERE user_id = p_user_id AND tags IS NOT NULL AND array_length(tags, 1) > 0
    ORDER BY tag;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_recent_chat_sessions(p_user_id uuid)
 RETURNS TABLE(id uuid, title text, last_message_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    cs.id,
    cs.title,
    cs.updated_at as last_message_at
  FROM
    public.chat_sessions cs
  WHERE
    cs.user_id = p_user_id
  ORDER BY
    cs.updated_at DESC
  LIMIT 15;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_memory_overview_stats()
 RETURNS TABLE(total_memories bigint, oldest_memory_date timestamp with time zone, newest_memory_date timestamp with time zone, total_tag_instances bigint, memories_with_tags_count bigint)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.memories) AS total_memories,
    (SELECT MIN(m.created_at) FROM public.memories m) AS oldest_memory_date,
    (SELECT MAX(m.created_at) FROM public.memories m) AS newest_memory_date,
    (SELECT COUNT(*) FROM (SELECT unnest(m.tags) FROM public.memories m WHERE m.tags IS NOT NULL AND m.tags <> '{}') AS unnested) AS total_tag_instances,
    (SELECT COUNT(*) FROM public.memories m WHERE m.tags IS NOT NULL AND m.tags <> '{}') AS memories_with_tags_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_recent_conversations(p_user_id uuid, p_limit integer DEFAULT 10)
 RETURNS TABLE(conversation_title text, latest_message_time timestamp with time zone, conversation_start_time timestamp with time zone)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
WITH conversation_activity AS (
    SELECT
        m.conversation_title,
        MAX(m.create_time) AS max_message_time 
    FROM
        memories m
    WHERE
        m.user_id = p_user_id
        AND m.conversation_title IS NOT NULL  -- <<< Condition 1
    GROUP BY
        m.conversation_title
),
conversation_details AS (
    SELECT DISTINCT ON (ca.conversation_title)
        ca.conversation_title,
        m.conversation_start_time
    FROM
        conversation_activity ca
    JOIN
        memories m ON ca.conversation_title = m.conversation_title AND m.create_time = ca.max_message_time AND m.user_id = p_user_id
    ORDER BY
        ca.conversation_title, m.created_at DESC -- Should probably be m.create_time if that's more accurate
)
SELECT
    ca.conversation_title,
    ca.max_message_time AS latest_message_time,
    cd.conversation_start_time
FROM
    conversation_activity ca
LEFT JOIN
    conversation_details cd ON ca.conversation_title = cd.conversation_title
ORDER BY
    latest_message_time DESC
LIMIT
    p_limit;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.user_profiles (id, username, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', NEW.email), 'user');
  
  INSERT INTO public.token_usage (user_id, tokens_used, tokens_limit)
  VALUES (NEW.id, 0, 1000);
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."chat_messages" to "anon";

grant insert on table "public"."chat_messages" to "anon";

grant references on table "public"."chat_messages" to "anon";

grant select on table "public"."chat_messages" to "anon";

grant trigger on table "public"."chat_messages" to "anon";

grant truncate on table "public"."chat_messages" to "anon";

grant update on table "public"."chat_messages" to "anon";

grant delete on table "public"."chat_messages" to "authenticated";

grant insert on table "public"."chat_messages" to "authenticated";

grant references on table "public"."chat_messages" to "authenticated";

grant select on table "public"."chat_messages" to "authenticated";

grant trigger on table "public"."chat_messages" to "authenticated";

grant truncate on table "public"."chat_messages" to "authenticated";

grant update on table "public"."chat_messages" to "authenticated";

grant delete on table "public"."chat_messages" to "service_role";

grant insert on table "public"."chat_messages" to "service_role";

grant references on table "public"."chat_messages" to "service_role";

grant select on table "public"."chat_messages" to "service_role";

grant trigger on table "public"."chat_messages" to "service_role";

grant truncate on table "public"."chat_messages" to "service_role";

grant update on table "public"."chat_messages" to "service_role";

create policy "Allow full access to own chat history"
on "public"."chat_messages"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM chat_sessions cs
  WHERE ((cs.id = chat_messages.chat_session_id) AND (cs.user_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM chat_sessions cs
  WHERE ((cs.id = chat_messages.chat_session_id) AND (cs.user_id = auth.uid())))));


create policy "Users can insert their own chat history"
on "public"."chat_messages"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can only see their own chat history"
on "public"."chat_messages"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can view their own chat history"
on "public"."chat_messages"
as permissive
for select
to public
using (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM chat_sessions cs
  WHERE ((cs.id = chat_messages.chat_session_id) AND (cs.user_id = auth.uid()))))));



