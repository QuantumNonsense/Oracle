import { uploadJournalEvents } from "./supabaseApi";
import { storage } from "./storage";

declare const __DEV__: boolean | undefined;

export type JournaledCard = {
  id: string;
  title?: string;
};

export type JournalEvent = {
  id: string;
  cardId: string;
  cardTitle?: string | null;
  deckId: string;
  journaledAt: string;
  clientSessionId?: string | null;
  clientTimezone?: string | null;
  appVersion?: string | null;
};

export type RecordJournalOptions = {
  deckId?: string;
  journaledAt?: string;
  appVersion?: string;
};

const PENDING_JOURNAL_EVENTS_KEY = "oracle:journal-events:pending:v1";
const CLIENT_SESSION_ID_KEY = "oracle:client-session-id:v1";
const DEFAULT_DECK_ID = "default";

let pendingQueueWrite = Promise.resolve();
let pendingFlush: Promise<boolean> | null = null;
let cachedClientSessionId: string | null = null;

const createUuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16);
    const next = char === "x" ? value : (value & 0x3) | 0x8;
    return next.toString(16);
  });

const isJournalEvent = (value: unknown): value is JournalEvent => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const event = value as JournalEvent;
  return (
    typeof event.id === "string" &&
    typeof event.cardId === "string" &&
    typeof event.deckId === "string" &&
    typeof event.journaledAt === "string"
  );
};

const parseJournalEvents = (raw: string | null): JournalEvent[] => {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isJournalEvent);
  } catch (error) {
    return [];
  }
};

const writePendingJournalEvents = async (events: JournalEvent[]) => {
  await storage.setItem(PENDING_JOURNAL_EVENTS_KEY, JSON.stringify(events));
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

export const buildJournalEvent = (
  card: JournaledCard,
  {
    deckId = DEFAULT_DECK_ID,
    journaledAt = new Date().toISOString(),
    appVersion,
  }: RecordJournalOptions = {},
  metadata: {
    clientSessionId?: string | null;
    clientTimezone?: string | null;
  } = {},
): JournalEvent => ({
  id: createUuid(),
  cardId: card.id,
  cardTitle: card.title ?? null,
  deckId,
  journaledAt,
  clientSessionId: metadata.clientSessionId ?? null,
  clientTimezone: metadata.clientTimezone ?? null,
  appVersion: appVersion ?? null,
});

export const getPendingJournalEvents = async () =>
  parseJournalEvents(await storage.getItem(PENDING_JOURNAL_EVENTS_KEY));

export const enqueueJournalEvent = async (event: JournalEvent) =>
  withPendingQueueWrite(async () => {
    const pending = await getPendingJournalEvents();
    const next = [...pending, event];
    await writePendingJournalEvents(next);
    return next;
  });

export const recordJournalEvent = async (
  card: JournaledCard,
  options: RecordJournalOptions = {},
) => {
  const event = buildJournalEvent(card, options, {
    clientSessionId: await getClientSessionId(),
    clientTimezone: getClientTimezone(),
  });
  await enqueueJournalEvent(event);
  void flushPendingJournalEvents();
  return event;
};

export const flushPendingJournalEvents = async () => {
  if (pendingFlush) {
    return pendingFlush;
  }

  pendingFlush = (async () => {
    const pending = await getPendingJournalEvents();
    if (pending.length === 0) {
      return true;
    }

    try {
      const didUpload = await uploadJournalEvents(pending);
      if (!didUpload) {
        return false;
      }
      await removePendingJournalEvents(pending.map((event) => event.id));
      return true;
    } catch (error) {
      if (isDev()) {
        console.warn("Failed to flush Supabase journal events.", error);
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

export const removePendingJournalEvents = async (syncedEventIds: string[]) => {
  if (syncedEventIds.length === 0) {
    return getPendingJournalEvents();
  }

  const syncedIds = new Set(syncedEventIds);
  return withPendingQueueWrite(async () => {
    const pending = await getPendingJournalEvents();
    const next = pending.filter((event) => !syncedIds.has(event.id));
    await writePendingJournalEvents(next);
    return next;
  });
};

export const clearPendingJournalEvents = async () => {
  await withPendingQueueWrite(async () => {
    await writePendingJournalEvents([]);
  });
};
