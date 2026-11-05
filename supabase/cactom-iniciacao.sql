-- Cactom · Curso de Iniciação Musical no ranking e na Comunidade
-- Rode UMA VEZ no SQL Editor do Supabase (depois dos outros dois arquivos). Pode rodar de novo sem problema.
-- Só acrescenta o curso 'iniciacao' nas listas permitidas; nada é apagado.

alter table public.ranking drop constraint if exists ranking_instrument_check;
alter table public.ranking add constraint ranking_instrument_check check (instrument in ('iniciacao','recorder-soprano','trumpet-bb','clarinet-bb'));

alter table public.chat_perfis drop constraint if exists chat_perfis_instrument_check;
alter table public.chat_perfis add constraint chat_perfis_instrument_check check (instrument in ('iniciacao','recorder-soprano','trumpet-bb','clarinet-bb'));

alter table public.chat_mensagens drop constraint if exists chat_mensagens_channel_check;
alter table public.chat_mensagens add constraint chat_mensagens_channel_check check (channel in ('geral','iniciacao','recorder-soprano','trumpet-bb','clarinet-bb'));

create or replace function public.ranking_atualizar(
  p_profile text, p_token text, p_instrument text, p_name text,
  p_xp integer, p_lessons integer, p_answered integer, p_correct integer,
  p_streak integer, p_last timestamptz)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare
  h   text := encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex');
  cur text;
begin
  if p_profile is null or char_length(p_profile) > 64 or char_length(coalesce(p_token, '')) < 20
     or p_name is null or char_length(p_name) not between 1 and 40
     or p_instrument not in ('iniciacao','recorder-soprano','trumpet-bb','clarinet-bb')
     or p_xp not between 0 and 100000 or p_lessons not between 0 and 2000
     or p_answered not between 0 and 100000 or p_correct not between 0 and p_answered
     or p_streak not between 0 and 5000 then
    return false;
  end if;
  select token_hash into cur from public.ranking where profile_id = p_profile and instrument = p_instrument;
  if cur is not null and cur <> h then
    return false; -- outro aparelho tentando mexer no ranking de alguém
  end if;
  insert into public.ranking (profile_id, instrument, name, xp, lessons, answered, correct, streak, last_at, token_hash)
  values (p_profile, p_instrument, p_name, p_xp, p_lessons, p_answered, p_correct, p_streak, p_last, h)
  on conflict (profile_id, instrument) do update set
    name = excluded.name, xp = excluded.xp, lessons = excluded.lessons, answered = excluded.answered,
    correct = excluded.correct, streak = excluded.streak, last_at = excluded.last_at, updated_at = now();
  return true;
end $$;
revoke all on function public.ranking_atualizar(text,text,text,text,integer,integer,integer,integer,integer,timestamptz) from public;
grant execute on function public.ranking_atualizar(text,text,text,text,integer,integer,integer,integer,integer,timestamptz) to anon, authenticated;

create or replace function public.chat_entrar(
  p_profile text, p_token text, p_name text, p_instrument text, p_responsavel text, p_ano_responsavel integer)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare
  h   text := encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex');
  cur public.chat_perfis;
  ano integer := extract(year from now())::integer;
begin
  if p_profile is null or char_length(p_profile) > 64 or char_length(coalesce(p_token, '')) < 20
     or p_name is null or char_length(btrim(p_name)) not between 1 and 40
     or p_instrument not in ('iniciacao','recorder-soprano','trumpet-bb','clarinet-bb') then
    return 'invalido';
  end if;
  select * into cur from public.chat_perfis where profile_id = p_profile;
  if found then
    if cur.token_hash <> h then return 'outro-aparelho'; end if;
    if cur.bloqueado then return 'bloqueado'; end if;
    update public.chat_perfis set name = btrim(p_name), instrument = p_instrument where profile_id = p_profile;
    return 'ok';
  end if;
  -- primeira vez: precisa do responsável (maior de 18)
  if p_responsavel is null or char_length(btrim(p_responsavel)) not between 2 and 60
     or p_ano_responsavel is null or p_ano_responsavel < ano - 100 or p_ano_responsavel > ano - 18 then
    return 'responsavel';
  end if;
  insert into public.chat_perfis (profile_id, token_hash, name, instrument, responsavel, ano_responsavel)
  values (p_profile, h, btrim(p_name), p_instrument, btrim(p_responsavel), p_ano_responsavel);
  return 'ok';
end $$;
revoke all on function public.chat_entrar(text,text,text,text,text,integer) from public;
grant execute on function public.chat_entrar(text,text,text,text,text,integer) to anon, authenticated;
