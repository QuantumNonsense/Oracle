create table if not exists public.card_journal_events (
  id uuid primary key,
  card_id text not null,
  card_title text,
  deck_id text not null default 'default',
  journaled_at timestamptz not null,
  client_session_id uuid,
  client_timezone text,
  app_version text,
  received_at timestamptz not null default now()
);

create index if not exists card_journal_events_journaled_at_idx
  on public.card_journal_events (journaled_at desc);

create index if not exists card_journal_events_deck_journaled_at_idx
  on public.card_journal_events (deck_id, journaled_at desc);

create index if not exists card_journal_events_card_journaled_at_idx
  on public.card_journal_events (card_id, journaled_at desc);

create index if not exists card_journal_events_client_session_journaled_at_idx
  on public.card_journal_events (client_session_id, journaled_at desc);

alter table public.card_journal_events enable row level security;

grant usage on schema public to anon, authenticated;
grant insert on table public.card_journal_events to anon, authenticated;

drop policy if exists "Anyone can record anonymous journal events"
  on public.card_journal_events;

create policy "Anyone can record anonymous journal events"
  on public.card_journal_events
  for insert
  to public
  with check (true);

create or replace function public.get_card_journal_counts(
  range_start timestamptz,
  range_end timestamptz,
  target_deck_id text default 'default'
)
returns table (
  card_id text,
  journal_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    events.card_id,
    count(*) as journal_count
  from public.card_journal_events as events
  where events.deck_id = target_deck_id
    and events.journaled_at >= range_start
    and events.journaled_at < range_end
  group by events.card_id
  order by journal_count desc, events.card_id asc;
$$;

revoke all on function public.get_card_journal_counts(timestamptz, timestamptz, text)
  from public;

grant execute on function public.get_card_journal_counts(timestamptz, timestamptz, text)
  to anon, authenticated;
