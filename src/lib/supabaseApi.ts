import type { DrawEvent } from "./drawTracking";

type SupabaseConfig = {
  url: string;
  key: string;
};

type SupabaseDrawEventRow = {
  id: string;
  card_id: string;
  deck_id: string;
  draw_mode: string;
  batch_id: string;
  position: number;
  drawn_at: string;
};

declare const process:
  | {
      env: {
        EXPO_PUBLIC_SUPABASE_URL?: string;
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
        EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
        NEXT_PUBLIC_SUPABASE_URL?: string;
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
        NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
      };
    };

declare const __DEV__: boolean | undefined;

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const isDev = () => typeof __DEV__ !== "undefined" && __DEV__;

export const getSupabaseConfig = (): SupabaseConfig | null => {
  const url =
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return {
    url: trimTrailingSlash(url),
    key,
  };
};

const toDrawEventRow = (event: DrawEvent): SupabaseDrawEventRow => ({
  id: event.id,
  card_id: event.cardId,
  deck_id: event.deckId,
  draw_mode: event.drawMode,
  batch_id: event.batchId,
  position: event.position,
  drawn_at: event.drawnAt,
});

export const uploadDrawEvents = async (events: DrawEvent[]) => {
  const config = getSupabaseConfig();
  if (!config || events.length === 0) {
    if (!config && isDev()) {
      console.warn(
        "Supabase draw tracking is disabled: missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
      );
    }
    return false;
  }

  const response = await fetch(
    `${config.url}/rest/v1/card_draw_events?on_conflict=id`,
    {
      method: "POST",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates,return=minimal",
      },
      body: JSON.stringify(events.map(toDrawEventRow)),
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `Failed to upload draw events (${response.status}): ${message}`,
    );
  }

  return true;
};
