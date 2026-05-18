import { uploadDrawEvents } from "./supabaseApi";
import { storage } from "./storage";

declare const __DEV__: boolean | undefined;

export type DrawMode = "single" | "triple";

export type DrawnCard = {
  id: string;
  title?: string;
};

export type DrawEvent = {
  id: string;
  cardId: string;
  cardTitle?: string | null;
  deckId: string;
  drawMode: DrawMode;
  batchId: string;
  position: number;
  selectionSlot?: number | null;
  drawnAt: string;
  clientSessionId?: string | null;
  clientTimezone?: string | null;
  appVersion?: string | null;
  isFirstDrawOfSession?: boolean;
};

export type RecordDrawOptions = {
  deckId?: string;
  drawMode: DrawMode;
  batchId?: string;
  drawnAt?: string;
  appVersion?: string;
  selectionSlots?: Array<number | null | undefined>;
};

const PENDING_DRAW_EVENTS_KEY = "oracle:draw-events:pending:v1";
const CLIENT_SESSION_ID_KEY = "oracle:client-session-id:v1";
const DEFAULT_DECK_ID = "default";

let pendingQueueWrite = Promise.resolve();
let pendingFlush: Promise<boolean> | null = null;
let cachedClientSessionId: string | null = null;
let hasRecordedDrawThisSession = false;

const createUuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16);
    const next = char === "x" ? value : (value & 0x3) | 0x8;
    return next.toString(16);
  });

const isDrawMode = (value: unknown): value is DrawMode =>
  value === "single" || value === "triple";

const isDrawEvent = (value: unknown): value is DrawEvent => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const event = value as DrawEvent;
  return (
    typeof event.id === "string" &&
    typeof event.cardId === "string" &&
    typeof event.deckId === "string" &&
    isDrawMode(event.drawMode) &&
    typeof event.batchId === "string" &&
    typeof event.position === "number" &&
    typeof event.drawnAt === "string"
  );
};

const parseDrawEvents = (raw: string | null): DrawEvent[] => {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isDrawEvent);
  } catch (error) {
    return [];
  }
};

const writePendingDrawEvents = async (events: DrawEvent[]) => {
  await storage.setItem(PENDING_DRAW_EVENTS_KEY, JSON.stringify(events));
};

const withPendingQueueWrite = async <T>(work: () => Promise<T>) => {
  const nextWrite = pendingQueueWrite.then(work, work);
  pendingQueueWrite = nextWrite.then(
    () => undefined,
    () => undefined,
  );
  return nextWrite;
};

const isDev = () => typeof __DEV__ !== "undefined" && __DEV__;

const getClientTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch (error) {
    return null;
  }
};

const getClientSessionId = async () => {
  if (cachedClientSessionId) {
    return cachedClientSessionId;
  }

  const stored = await storage.getItem(CLIENT_SESSION_ID_KEY);
  if (stored) {
    cachedClientSessionId = stored;
    return stored;
  }

  const next = createUuid();
  cachedClientSessionId = next;
  await storage.setItem(CLIENT_SESSION_ID_KEY, next);
  return next;
};

export const buildDrawEvents = (
  cards: DrawnCard[],
  {
    deckId = DEFAULT_DECK_ID,
    drawMode,
    batchId = createUuid(),
    drawnAt = new Date().toISOString(),
    appVersion,
    selectionSlots = [],
  }: RecordDrawOptions,
  metadata: {
    clientSessionId?: string | null;
    clientTimezone?: string | null;
    isFirstDrawOfSession?: boolean;
  } = {},
): DrawEvent[] =>
  cards.map((card, position) => ({
    id: createUuid(),
    cardId: card.id,
    cardTitle: card.title ?? null,
    deckId,
    drawMode,
    batchId,
    position,
    selectionSlot: selectionSlots[position] ?? null,
    drawnAt,
    clientSessionId: metadata.clientSessionId ?? null,
    clientTimezone: metadata.clientTimezone ?? null,
    appVersion: appVersion ?? null,
    isFirstDrawOfSession: metadata.isFirstDrawOfSession ?? false,
  }));

export const getPendingDrawEvents = async () =>
  parseDrawEvents(await storage.getItem(PENDING_DRAW_EVENTS_KEY));

export const enqueueDrawEvents = async (events: DrawEvent[]) => {
  if (events.length === 0) {
    return [];
  }

  return withPendingQueueWrite(async () => {
    const pending = await getPendingDrawEvents();
    const next = [...pending, ...events];
    await writePendingDrawEvents(next);
    return next;
  });
};

export const recordDrawEvents = async (
  cards: DrawnCard[],
  options: RecordDrawOptions,
) => {
  const isFirstDrawOfSession = !hasRecordedDrawThisSession;
  hasRecordedDrawThisSession = true;
  const events = buildDrawEvents(cards, options, {
    clientSessionId: await getClientSessionId(),
    clientTimezone: getClientTimezone(),
    isFirstDrawOfSession,
  });
  await enqueueDrawEvents(events);
  void flushPendingDrawEvents();
  return events;
};

export const flushPendingDrawEvents = async () => {
  if (pendingFlush) {
    return pendingFlush;
  }

  pendingFlush = (async () => {
    const pending = await getPendingDrawEvents();
    if (pending.length === 0) {
      return true;
    }

    try {
      const didUpload = await uploadDrawEvents(pending);
      if (!didUpload) {
        return false;
      }
      await removePendingDrawEvents(pending.map((event) => event.id));
      return true;
    } catch (error) {
      if (isDev()) {
        console.warn("Failed to flush Supabase draw events.", error);
      }
      return false;
    }
  })();

  try {
    return await pendingFlush;
  } finally {
    pendingFlush = null;
  }
};

export const removePendingDrawEvents = async (syncedEventIds: string[]) => {
  if (syncedEventIds.length === 0) {
    return getPendingDrawEvents();
  }

  const syncedIds = new Set(syncedEventIds);
  return withPendingQueueWrite(async () => {
    const pending = await getPendingDrawEvents();
    const next = pending.filter((event) => !syncedIds.has(event.id));
    await writePendingDrawEvents(next);
    return next;
  });
};

export const clearPendingDrawEvents = async () => {
  await withPendingQueueWrite(async () => {
    await writePendingDrawEvents([]);
  });
};
