-- Cactom · Comunidade online (rode DEPOIS de cactom-banco.sql, no SQL Editor do Supabase)
-- Pode rodar de novo sem problema: só cria o que faltar e atualiza as funções.
--
-- Como protege as crianças:
--  * Ninguém lê nem escreve direto nas tabelas. Tudo passa por funções que conferem
--    o token secreto do perfil (guardado só no aparelho da criança).
--  * Só entra no chat quem tem autorização de um responsável registrada.
--  * Cada criança só lê e escreve na Geral e na turma do instrumento dela.
--  * O servidor repete os filtros do app (telefone, e-mail, link, rede social, endereço, palavrão)
--    e limita a velocidade de envio.
--  * 3 denúncias escondem a mensagem na hora; o desenvolvedor revê tudo no painel.

-- 1. Tabelas -------------------------------------------------------------------
create table if not exists public.chat_perfis (
  profile_id       text primary key check (char_length(profile_id) <= 64),
  token_hash       text not null,
  name             text not null check (char_length(name) between 1 and 40),
  instrument       text not null check (instrument in ('recorder-soprano','trumpet-bb','clarinet-bb')),
  responsavel      text not null check (char_length(responsavel) between 2 and 60),
  ano_responsavel  integer not null,
  consent_at       timestamptz not null default now(),
  bloqueado        boolean not null default false,
  created_at       timestamptz not null default now()
);
alter table public.chat_perfis enable row level security;

create table if not exists public.chat_mensagens (
  id          uuid primary key default extensions.gen_random_uuid(),
  channel     text not null check (channel in ('geral','recorder-soprano','trumpet-bb','clarinet-bb')),
  profile_id  text not null references public.chat_perfis(profile_id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 40),
  text        text not null check (char_length(text) between 1 and 240),
  at          timestamptz not null default now(),
  hidden      boolean not null default false,
  reports     integer not null default 0
);
create index if not exists chat_mensagens_sala on public.chat_mensagens (channel, at desc);
alter table public.chat_mensagens enable row level security;

create table if not exists public.chat_denuncias (
  message_id  uuid not null references public.chat_mensagens(id) on delete cascade,
  profile_id  text not null,
  at          timestamptz not null default now(),
  primary key (message_id, profile_id)
);
alter table public.chat_denuncias enable row level security;

-- Só o desenvolvedor (painel, logado) vê e modera direto nas tabelas.
drop policy if exists "dev le perfis do chat" on public.chat_perfis;
create policy "dev le perfis do chat" on public.chat_perfis for select to authenticated using (public.eh_desenvolvedor());
drop policy if exists "dev bloqueia perfis do chat" on public.chat_perfis;
create policy "dev bloqueia perfis do chat" on public.chat_perfis for update to authenticated using (public.eh_desenvolvedor()) with check (public.eh_desenvolvedor());
drop policy if exists "dev le mensagens" on public.chat_mensagens;
create policy "dev le mensagens" on public.chat_mensagens for select to authenticated using (public.eh_desenvolvedor());
drop policy if exists "dev esconde mensagens" on public.chat_mensagens;
create policy "dev esconde mensagens" on public.chat_mensagens for update to authenticated using (public.eh_desenvolvedor()) with check (public.eh_desenvolvedor());
drop policy if exists "dev apaga mensagens" on public.chat_mensagens;
create policy "dev apaga mensagens" on public.chat_mensagens for delete to authenticated using (public.eh_desenvolvedor());
drop policy if exists "dev le denuncias" on public.chat_denuncias;
create policy "dev le denuncias" on public.chat_denuncias for select to authenticated using (public.eh_desenvolvedor());

-- 2. Filtro de texto (o mesmo do app) ------------------------------------------
create or replace function public.chat_motivo_bloqueio(p_text text)
returns text language plpgsql immutable set search_path = public as $$
declare t text := btrim(regexp_replace(coalesce(p_text, ''), '\s+', ' ', 'g'));
begin
  if t = '' then return 'vazia'; end if;
  if char_length(t) > 240 then return 'grande'; end if;
  if exists (select 1 from regexp_matches(t, '[0-9 ().+-]{8,}', 'g') m
             where char_length(regexp_replace(m[1], '\D', '', 'g')) >= 8) then return 'telefone'; end if;
  if t ~ '[A-Za-z0-9._+-]+@[A-Za-z0-9-]+\.[A-Za-z0-9.]+' then return 'e-mail'; end if;
  if t ~* '(https?://|www\.|\.com\y|\.br\y|\.net\y)' then return 'link'; end if;
  if t ~ '(^|\s)@\w{3,}' then return 'rede social'; end if;
  if t ~* '\y(whats ?app|zap|insta(gram)?|tik ?tok|facebook|telegram|discord|snap(chat)?)\y' then return 'rede social'; end if;
  if t ~* '\y(endere[cç]o|moro na|moro no|minha rua|bairro|cep|meu n[úu]mero|me chama no|onde (tu|voc[êe]) mora)\y' then return 'endereço'; end if;
  if t ~* '\y(porra|caralho|merda|bosta|puta|put[ao]|fdp|vsf|vtnc|idiota|burr[oa]|ot[áa]ri[oa]|imbecil|cala a boca)\y' then return 'palavra'; end if;
  return null;
end $$;

-- confere token + autorização; devolve o perfil ou nada
create or replace function public.chat_perfil_ok(p_profile text, p_token text)
returns public.chat_perfis language sql stable security definer set search_path = public, extensions as $$
  select p.* from public.chat_perfis p
  where p.profile_id = p_profile and not p.bloqueado
    and p.token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex');
$$;
revoke all on function public.chat_perfil_ok(text,text) from public, anon, authenticated;

-- 3. Entrar (registra a autorização do responsável) ----------------------------
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
     or p_instrument not in ('recorder-soprano','trumpet-bb','clarinet-bb') then
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

-- 4. Ler a sala ----------------------------------------------------------------
create or replace function public.chat_mensagens_da_sala(p_profile text, p_token text, p_channel text, p_after timestamptz default null)
returns table (id uuid, channel text, profile_id text, name text, text text, at timestamptz)
language plpgsql stable security definer set search_path = public, extensions as $$
declare me public.chat_perfis;
begin
  me := public.chat_perfil_ok(p_profile, p_token);
  if me.profile_id is null or p_channel not in ('geral', me.instrument) then return; end if;
  return query
    select m.id, m.channel, m.profile_id, m.name, m.text, m.at from (
      select * from public.chat_mensagens x
      where x.channel = p_channel and not x.hidden and (p_after is null or x.at > p_after)
      order by x.at desc limit 100) m
    order by m.at asc;
end $$;
revoke all on function public.chat_mensagens_da_sala(text,text,text,timestamptz) from public;
grant execute on function public.chat_mensagens_da_sala(text,text,text,timestamptz) to anon, authenticated;

-- 5. Mandar mensagem -----------------------------------------------------------
create or replace function public.chat_enviar(p_profile text, p_token text, p_channel text, p_text text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  me  public.chat_perfis;
  why text;
  t   text := btrim(regexp_replace(coalesce(p_text, ''), '\s+', ' ', 'g'));
  msg public.chat_mensagens;
begin
  me := public.chat_perfil_ok(p_profile, p_token);
  if me.profile_id is null then return jsonb_build_object('ok', false, 'reason', 'sem-acesso'); end if;
  if p_channel not in ('geral', me.instrument) then return jsonb_build_object('ok', false, 'reason', 'sala'); end if;
  why := public.chat_motivo_bloqueio(t);
  if why is not null then return jsonb_build_object('ok', false, 'reason', why); end if;
  -- calma: no máximo 1 mensagem a cada 3 s e 20 a cada 10 min
  if exists (select 1 from public.chat_mensagens where profile_id = p_profile and at > now() - interval '3 seconds')
     or (select count(*) from public.chat_mensagens where profile_id = p_profile and at > now() - interval '10 minutes') >= 20 then
    return jsonb_build_object('ok', false, 'reason', 'rapido');
  end if;
  insert into public.chat_mensagens (channel, profile_id, name, text)
  values (p_channel, p_profile, split_part(me.name, ' ', 1), t) returning * into msg;
  return jsonb_build_object('ok', true, 'message', jsonb_build_object(
    'id', msg.id, 'channel', msg.channel, 'profile_id', msg.profile_id, 'name', msg.name, 'text', msg.text, 'at', msg.at));
end $$;
revoke all on function public.chat_enviar(text,text,text,text) from public;
grant execute on function public.chat_enviar(text,text,text,text) to anon, authenticated;

-- 6. Denunciar (o botão "Esconder") ---------------------------------------------
create or replace function public.chat_denunciar(p_profile text, p_token text, p_message uuid)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare me public.chat_perfis; n integer;
begin
  me := public.chat_perfil_ok(p_profile, p_token);
  if me.profile_id is null then return false; end if;
  insert into public.chat_denuncias (message_id, profile_id) values (p_message, p_profile) on conflict do nothing;
  select count(*) into n from public.chat_denuncias where message_id = p_message;
  update public.chat_mensagens set reports = n, hidden = hidden or n >= 3 where id = p_message;
  return true;
end $$;
revoke all on function public.chat_denunciar(text,text,uuid) from public;
grant execute on function public.chat_denunciar(text,text,uuid) to anon, authenticated;
