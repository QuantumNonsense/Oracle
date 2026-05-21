import type { DrawEvent } from "./drawTracking";

type SupabaseConfig = {
  url: string;
  key: string;
};

type SupabaseDrawEventRow = {
  id: string;
  card_id: string;
  card_title?: string | null;
  deck_id: string;
  draw_mode: string;
  batch_id: string;
  position: number;
  selection_slot?: number | null;
  drawn_at: string;
  client_session_id?: string | null;
  client_timezone?: string | null;
  app_version?: string | null;
  is_first_draw_of_session?: boolean;
};

export type CardDrawCount = {
  cardId: string;
  title: string | null;
  drawCount: number;
};

export type CardDrawBreakdown = {
  cardId: string;
  selectionSlot: number | null;
  drawMode: string;
  clientTimezone: string | null;
  drawCount: number;
};

type RawCardDrawCount = Record<string, unknown>;
type RawCardDrawBreakdown = Record<string, unknown>;

type CardDrawCountParams = {
  rangeStart: string;
  rangeEnd: string;
  targetDeckId?: string;
};

type CardDrawBreakdownParams = CardDrawCountParams & {
  cardId: string;
};

declare const process:
  | {
      env: {
        EXPO_PUBLIC_SUPABASE_URL?: string;
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
        EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
      };
    };

declare const __DEV__: boolean | undefined;

const normalizeSupabaseUrl = (value: string) => {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) {
    return trimmed;
  }
  if (/^https?:\/\//.test(trimmed)) {
    return trimmed;
  }
  if (!trimmed.includes(".")) {
    return `https://${trimmed}.supabase.co`;
  }
  return `https://${trimmed}`;
};

const isDev = () => typeof __DEV__ !== "undefined" && __DEV__;

export const getSupabaseConfig = (): SupabaseConfig | null => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key =
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return {
    url: normalizeSupabaseUrl(url),
    key,
  };
};

const toDrawEventRow = (event: DrawEvent): SupabaseDrawEventRow => ({
  id: event.id,
  card_id: event.cardId,
  card_title: event.cardTitle,
  deck_id: event.deckId,
  draw_mode: event.drawMode,
  batch_id: event.batchId,
  position: event.position,
  selection_slot: event.selectionSlot,
  drawn_at: event.drawnAt,
  client_session_id: event.clientSessionId,
  client_timezone: event.clientTimezone,
  app_version: event.appVersion,
  is_first_draw_of_session: event.isFirstDrawOfSession,
});

const getStringField = (row: RawCardDrawCount, keys: string[]) => {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return null;
};

const getNumberField = (row: RawCardDrawCount, keys: string[]) => {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return 0;
};

const getOptionalNumberField = (
  row: RawCardDrawBreakdown,
  keys: string[],
) => {
  for (const key of keys) {
    const value = row[key];
    if (value === null || typeof value === "undefined") {
      continue;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return null;
};

const toCardDrawCount = (row: RawCardDrawCount): CardDrawCount => ({
  cardId: getStringField(row, ["card_id", "id"]) ?? "unknown",
  title: getStringField(row, ["card_title", "card_name", "title", "name"]),
  drawCount: getNumberField(row, ["draw_count", "count", "total"]),
});

const toCardDrawBreakdown = (
  row: RawCardDrawBreakdown,
): CardDrawBreakdown => ({
  cardId: getStringField(row, ["card_id", "id"]) ?? "unknown",
  selectionSlot: getOptionalNumberField(row, [
    "selection_slot",
    "slot",
    "selectionSlot",
  ]),
  drawMode: getStringField(row, ["draw_mode", "mode", "drawMode"]) ?? "unknown",
  clientTimezone: getStringField(row, [
    "client_timezone",
    "timezone",
    "clientTimezone",
  ]),
  drawCount: getNumberField(row, ["draw_count", "count", "total"]),
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

  const endpoint = `${config.url}/rest/v1/card_draw_events`;
  if (isDev()) {
    console.info(`Uploading ${events.length} draw event(s) to ${endpoint}`);
  }

  const response = await fetch(
    endpoint,
    {
      method: "POST",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
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

export const getCardDrawCounts = async ({
  rangeStart,
  rangeEnd,
  targetDeckId = "default",
}: CardDrawCountParams): Promise<CardDrawCount[]> => {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error(
      "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  const response = await fetch(
    `${config.url}/rest/v1/rpc/get_card_draw_counts`,
    {
      method: "POST",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        range_start: rangeStart,
        range_end: rangeEnd,
        target_deck_id: targetDeckId,
      }),
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `Failed to load card draw counts (${response.status}): ${message}`,
    );
  }

  const rows = (await response.json()) as unknown;
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => toCardDrawCount(row as RawCardDrawCount));
};

export const getCardDrawBreakdown = async ({
  cardId,
  rangeStart,
  rangeEnd,
  targetDeckId = "default",
}: CardDrawBreakdownParams): Promise<CardDrawBreakdown[]> => {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error(
      "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  const response = await fetch(
    `${config.url}/rest/v1/rpc/get_card_draw_breakdown`,
    {
      method: "POST",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        range_start: rangeStart,
        range_end: rangeEnd,
        target_card_id: cardId,
        target_deck_id: targetDeckId,
      }),
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `Failed to load card draw breakdown (${response.status}): ${message}`,
    );
  }

  const rows = (await response.json()) as unknown;
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => toCardDrawBreakdown(row as RawCardDrawBreakdown));
};
