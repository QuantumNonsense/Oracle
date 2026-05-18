create table if not exists public.card_draw_events (
  id uuid primary key,
  card_id text not null,
  deck_id text not null default 'default',
  draw_mode text not null check (draw_mode in ('single', 'triple')),
  batch_id uuid not null,
  position smallint not null check (position >= 0 and position <= 2),
  drawn_at timestamptz not null,
  received_at timestamptz not null default now()
);

create index if not exists card_draw_events_drawn_at_idx
  on public.card_draw_events (drawn_at desc);

create index if not exists card_draw_events_deck_drawn_at_idx
  on public.card_draw_events (deck_id, drawn_at desc);

create index if not exists card_draw_events_card_drawn_at_idx
  on public.card_draw_events (card_id, drawn_at desc);

alter table public.card_draw_events enable row level security;

drop policy if exists "Anyone can record anonymous draw events"
  on public.card_draw_events;

create policy "Anyone can record anonymous draw events"
  on public.card_draw_events
  for insert
  to anon, authenticated
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
