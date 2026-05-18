create table if not exists public.card_draw_events (
  id uuid primary key,
  card_id text not null,
  card_title text,
  deck_id text not null default 'default',
  draw_mode text not null check (draw_mode in ('single', 'triple')),
  batch_id uuid not null,
  position smallint not null check (position >= 0 and position <= 2),
  selection_slot smallint check (selection_slot is null or selection_slot >= 0),
  drawn_at timestamptz not null,
  client_session_id uuid,
  client_timezone text,
  app_version text,
  is_first_draw_of_session boolean not null default false,
  received_at timestamptz not null default now()
);

alter table public.card_draw_events
  add column if not exists card_title text,
  add column if not exists selection_slot smallint,
  add column if not exists client_session_id uuid,
  add column if not exists client_timezone text,
  add column if not exists app_version text,
  add column if not exists is_first_draw_of_session boolean not null default false;

alter table public.card_draw_events
  drop constraint if exists card_draw_events_selection_slot_check;

alter table public.card_draw_events
  add constraint card_draw_events_selection_slot_check
  check (selection_slot is null or selection_slot >= 0);

create index if not exists card_draw_events_drawn_at_idx
  on public.card_draw_events (drawn_at desc);

create index if not exists card_draw_events_deck_drawn_at_idx
  on public.card_draw_events (deck_id, drawn_at desc);

create index if not exists card_draw_events_card_drawn_at_idx
  on public.card_draw_events (card_id, drawn_at desc);

create index if not exists card_draw_events_client_session_drawn_at_idx
  on public.card_draw_events (client_session_id, drawn_at desc);

alter table public.card_draw_events enable row level security;

grant usage on schema public to anon, authenticated;
grant insert on table public.card_draw_events to anon, authenticated;

drop policy if exists "Anyone can record anonymous draw events"
  on public.card_draw_events;

create policy "Anyone can record anonymous draw events"
  on public.card_draw_events
  for insert
  to public
  with check (true);

create or replace function public.get_card_draw_counts(
  range_start timestamptz,
  range_end timestamptz,
  target_deck_id text default 'default'
)
returns table (
  card_id text,
  draw_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    events.card_id,
    count(*) as draw_count
  from public.card_draw_events as events
  where events.deck_id = target_deck_id
    and events.drawn_at >= range_start
    and events.drawn_at < range_end
  group by events.card_id
  order by draw_count desc, events.card_id asc;
$$;

revoke all on function public.get_card_draw_counts(timestamptz, timestamptz, text)
  from public;

grant execute on function public.get_card_draw_counts(timestamptz, timestamptz, text)
  to anon, authenticated;
