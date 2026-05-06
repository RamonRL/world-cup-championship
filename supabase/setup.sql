-- ─────────────────────────────────────────────────────────────────────
-- World Cup Championship — Supabase setup
-- ─────────────────────────────────────────────────────────────────────
-- Run this once in the Supabase SQL editor AFTER `pnpm db:push` has
-- created the tables. Sets up RLS policies and realtime publication.
-- For local dev, you can also pipe this into psql.
--
--   - All app reads/writes go through Drizzle (the postgres role bypasses
--     RLS), so RLS is mostly a defense-in-depth layer for direct DB
--     access. Strict-mode RLS is enabled by default in Supabase.
--   - Realtime subscriptions DO require RLS to grant SELECT to the
--     authenticated role for chat_messages.
-- ─────────────────────────────────────────────────────────────────────

-- 1) Enable RLS on every public table (loop, también cubre tablas nuevas
--    que no aparezcan listadas explícitamente más abajo).
do $$
declare
  tbl text;
begin
  for tbl in
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename not like '%_drizzle_%'
  loop
    execute format('alter table public.%I enable row level security', tbl);
  end loop;
end;
$$;

-- Defensive: enable RLS también de forma explícita para las tablas que
-- añadimos en migraciones posteriores. Si el loop falla por permisos, esto
-- garantiza que las críticas quedan cubiertas.
alter table public.leagues enable row level security;
alter table public.league_memberships enable row level security;

-- 2) Profiles: each user can read/update their own row.
drop policy if exists "profiles read all" on public.profiles;
create policy "profiles read all" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- 3) Read-only public data for authenticated users.
do $$
declare
  tbl text;
begin
  for tbl in select unnest(array[
    'groups', 'teams', 'players', 'matchdays', 'matches', 'match_scorers',
    'group_standings', 'scoring_rules', 'special_predictions'
  ])
  loop
    execute format('drop policy if exists "%s read auth" on public.%I', tbl, tbl);
    execute format(
      'create policy "%s read auth" on public.%I for select to authenticated using (true)',
      tbl, tbl
    );
  end loop;
end;
$$;

-- 4) Predictions: each user reads/writes their own.
do $$
declare
  tbl text;
begin
  for tbl in select unnest(array[
    'pred_group_ranking', 'pred_bracket_slot', 'pred_tournament_top_scorer',
    'pred_match_result', 'pred_match_scorer', 'pred_special'
  ])
  loop
    execute format('drop policy if exists "%s self all" on public.%I', tbl, tbl);
    execute format(
      'create policy "%s self all" on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      tbl, tbl
    );
  end loop;
end;
$$;

-- 5) Chat: read for everyone, insert for self, update via service role only.
drop policy if exists "chat read" on public.chat_messages;
create policy "chat read" on public.chat_messages
  for select to authenticated using (true);

drop policy if exists "chat self insert" on public.chat_messages;
create policy "chat self insert" on public.chat_messages
  for insert to authenticated with check (auth.uid() = user_id);

-- 6a) Leagues + league_memberships: lectura para usuarios autenticados.
--     Las escrituras siempre van por el server (postgres role bypassa RLS),
--     así que sólo definimos políticas SELECT para defensa en profundidad.
drop policy if exists "leagues read auth" on public.leagues;
create policy "leagues read auth" on public.leagues
  for select to authenticated using (true);

drop policy if exists "league_memberships read self" on public.league_memberships;
create policy "league_memberships read self" on public.league_memberships
  for select to authenticated using (auth.uid() = user_id);

-- 6) Audit log + points ledger: read-only for authenticated (no insert/update from client).
drop policy if exists "audit read" on public.audit_log;
create policy "audit read" on public.audit_log
  for select to authenticated using (true);

drop policy if exists "ledger read" on public.points_ledger;
create policy "ledger read" on public.points_ledger
  for select to authenticated using (true);

-- 7) Realtime publication for chat_messages and matches (live results).
--    `alter publication ... add table` no es idempotente; envolvemos en
--    bloques que comprueben pg_publication_tables antes de añadir.
do $$
declare
  tbl text;
begin
  for tbl in select unnest(array['chat_messages', 'matches', 'match_scorers'])
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = tbl
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    end if;
  end loop;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- Storage buckets
-- ─────────────────────────────────────────────────────────────────────
-- Run via the dashboard or:
insert into storage.buckets (id, name, public)
values ('flags', 'flags', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
values ('players', 'players', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true) on conflict (id) do nothing;

-- Public-read for all three buckets is the default with public=true.
-- Writes happen exclusively via the service-role key in our admin actions,
-- so no upload policies are needed for authenticated users.
