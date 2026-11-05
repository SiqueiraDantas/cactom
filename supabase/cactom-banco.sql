-- ============================================================================
-- Cactom · banco de dados (Supabase)
-- Cole tudo no SQL Editor do Supabase e clique em "Run". Pode rodar de novo
-- sem problema: nada é apagado.
--
-- O que este SQL cria:
--   1. eventos         → o app só GRAVA; só o desenvolvedor LÊ (painel).
--   2. ranking         → ninguém mexe direto; o app atualiza por uma função que
--                        confere o "token" do aparelho; todos leem só o
--                        primeiro nome e os números (função ranking_do_instrumento).
--   3. desenvolvedores → e-mails que podem abrir o painel.
-- Nada de áudio, tela, senha ou localização é guardado.
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- 1. Quem pode abrir o painel -------------------------------------------------
create table if not exists public.desenvolvedores (
  email text primary key check (email = lower(email))
);
alter table public.desenvolvedores enable row level security;
-- sem políticas: ninguém lê nem altera esta tabela pelo app
insert into public.desenvolvedores (email) values ('siqdantas27@gmail.com')
  on conflict do nothing;

create or replace function public.eh_desenvolvedor()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.desenvolvedores
                 where email = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;
revoke all on function public.eh_desenvolvedor() from public;
grant execute on function public.eh_desenvolvedor() to anon, authenticated;

-- 2. Eventos do app -----------------------------------------------------------
create table if not exists public.eventos (
  id            uuid primary key,
  at            timestamptz not null,
  type          text not null check (char_length(type) <= 24),
  session       text not null check (char_length(session) <= 64),
  device        text check (char_length(device) <= 64),
  profile_id    text check (char_length(profile_id) <= 64),
  profile_name  text check (char_length(profile_name) <= 40),
  instrument    text check (char_length(instrument) <= 32),
  data          jsonb check (pg_column_size(data) < 4000),
  received_at   timestamptz not null default now()
);
create index if not exists eventos_at_idx on public.eventos (at desc);
create index if not exists eventos_profile_idx on public.eventos (profile_id);
alter table public.eventos enable row level security;

drop policy if exists "app grava eventos" on public.eventos;
create policy "app grava eventos" on public.eventos
  for insert to anon, authenticated
  with check (at > now() - interval '7 days' and at < now() + interval '1 day');

drop policy if exists "desenvolvedor le eventos" on public.eventos;
create policy "desenvolvedor le eventos" on public.eventos
  for select to authenticated using (public.eh_desenvolvedor());

drop policy if exists "desenvolvedor apaga eventos" on public.eventos;
create policy "desenvolvedor apaga eventos" on public.eventos
  for delete to authenticated using (public.eh_desenvolvedor());

-- 3. Ranking ------------------------------------------------------------------
create table if not exists public.ranking (
  profile_id  text not null check (char_length(profile_id) <= 64),
  instrument  text not null check (instrument in ('recorder-soprano','trumpet-bb','clarinet-bb')),
  name        text not null check (char_length(name) between 1 and 40),
  xp          integer not null default 0,
  lessons     integer not null default 0,
  answered    integer not null default 0,
  correct     integer not null default 0,
  streak      integer not null default 0,
  last_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  token_hash  text not null,
  primary key (profile_id, instrument)
);
alter table public.ranking enable row level security;
-- sem políticas: o app só usa as duas funções abaixo

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
     or p_instrument not in ('recorder-soprano','trumpet-bb','clarinet-bb')
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

create or replace function public.ranking_do_instrumento(p_instrument text)
returns table (profile_id text, name text, xp integer, lessons integer, answered integer, correct integer,
               streak integer, last_at timestamptz, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select r.profile_id, r.name, r.xp, r.lessons, r.answered, r.correct, r.streak, r.last_at, r.created_at
  from public.ranking r
  where r.instrument = p_instrument
  order by r.xp desc
  limit 200;
$$;
revoke all on function public.ranking_do_instrumento(text) from public;
grant execute on function public.ranking_do_instrumento(text) to anon, authenticated;
