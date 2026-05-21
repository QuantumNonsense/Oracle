import { useEffect, useMemo, useState } from "react";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { cards } from "../decks/defaultDeck";
import {
  getCardDrawCounts,
  type CardDrawCount,
} from "../lib/supabaseApi";

type StatsRangeKey = "today" | "week" | "month";

type StatsRange = {
  key: StatsRangeKey;
  label: string;
  start: Date;
  end: Date;
};

type RangeState = {
  label: string;
  data: CardDrawCount[];
};

type LoadState =
  | { status: "loading"; ranges: RangeState[]; lastUpdated: Date | null }
  | { status: "ready"; ranges: RangeState[]; lastUpdated: Date }
  | {
      status: "error";
      ranges: RangeState[];
      lastUpdated: Date | null;
      message: string;
    };

const TOP_CARD_LIMIT = 10;
const DECK_ID = "default";

const cardTitlesById = new Map(cards.map((card) => [card.id, card.title]));

const startOfToday = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const startOfWeek = (date: Date) => {
  const start = startOfToday(date);
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + mondayOffset);
  return start;
};

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const buildRanges = (now: Date): StatsRange[] => [
  {
    key: "today",
    label: "Today",
    start: startOfToday(now),
    end: now,
  },
  {
    key: "week",
    label: "This Week",
    start: startOfWeek(now),
    end: now,
  },
  {
    key: "month",
    label: "This Month",
    start: startOfMonth(now),
    end: now,
  },
];

const formatLastUpdated = (date: Date | null) => {
  if (!date) {
    return "Loading";
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getDisplayTitle = (item: CardDrawCount) =>
  item.title ?? cardTitlesById.get(item.cardId) ?? item.cardId;

const createEmptyRanges = () =>
  buildRanges(new Date()).map((range) => ({ label: range.label, data: [] }));

const StatsPanel = ({
  data,
  isLoading,
  label,
}: {
  data: CardDrawCount[];
  isLoading: boolean;
  label: string;
}) => (
  <View style={styles.panel}>
    <View style={styles.panelHeader}>
      <Text style={styles.panelTitle}>{label}</Text>
      <Text style={styles.panelMeta}>Top {TOP_CARD_LIMIT}</Text>
    </View>

    {isLoading ? (
      <View style={styles.stateBox}>
        <Text style={styles.stateText}>Gathering the current draw pattern.</Text>
      </View>
    ) : data.length === 0 ? (
      <View style={styles.stateBox}>
        <Text style={styles.stateText}>No global draws recorded yet.</Text>
      </View>
    ) : (
      <View style={styles.rankList}>
        {data.slice(0, TOP_CARD_LIMIT).map((item, index) => (
          <View key={`${item.cardId}-${index}`} style={styles.rankRow}>
            <Text style={styles.rankNumber}>{index + 1}</Text>
            <View style={styles.rankBody}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {getDisplayTitle(item)}
              </Text>
              <Text style={styles.cardId} numberOfLines={1}>
                {item.cardId}
              </Text>
            </View>
            <Text style={styles.drawCount}>
              {item.drawCount.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    )}
  </View>
);

export default function StatsLandingPage() {
  const { height, width } = useWindowDimensions();
  const [state, setState] = useState<LoadState>({
    status: "loading",
    ranges: createEmptyRanges(),
    lastUpdated: null,
  });

  const isWide = width >= 980;
  const loadedAtLabel = useMemo(
    () => formatLastUpdated(state.lastUpdated),
    [state.lastUpdated],
  );

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      const ranges = buildRanges(new Date());
      setState((prev) => ({
        ...prev,
        status: "loading",
        ranges: ranges.map((range) => ({ label: range.label, data: [] })),
      }));

      try {
        const results = await Promise.all(
          ranges.map(async (range) => ({
            label: range.label,
            data: await getCardDrawCounts({
              rangeStart: range.start.toISOString(),
              rangeEnd: range.end.toISOString(),
              targetDeckId: DECK_ID,
            }),
          })),
        );

        if (!isMounted) {
          return;
        }

        setState({
          status: "ready",
          ranges: results,
          lastUpdated: new Date(),
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setState({
          status: "error",
          ranges: ranges.map((range) => ({ label: range.label, data: [] })),
          lastUpdated: null,
          message:
            error instanceof Error
              ? error.message
              : "The global draw snapshot could not be loaded.",
        });
      }
    };

    void loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ImageBackground
      source={require("../../assets/backgrounds/mushroom-field.png")}
      style={[styles.background, { minHeight: height }]}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        <ScrollView
          contentContainerStyle={styles.page}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Text style={styles.kicker}>MyOracle Statistics</Text>
            <Text style={styles.title}>MyOracle Global Card Draws</Text>
            <Text style={styles.subtitle}>
              A living snapshot of the cards being drawn across the MyOracle
              deck.
            </Text>
            <Text style={styles.updated}>Last updated {loadedAtLabel}</Text>
          </View>

          {state.status === "error" ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>Stats are unavailable</Text>
              <Text style={styles.errorText}>{state.message}</Text>
            </View>
          ) : null}

          <View style={[styles.panelGrid, isWide && styles.panelGridWide]}>
            {state.ranges.map((range) => (
              <StatsPanel
                key={range.label}
                data={range.data}
                isLoading={state.status === "loading"}
                label={range.label}
              />
            ))}
          </View>

          <Text style={styles.footerNote}>
            Aggregate public counts only. Individual draw events are not shown.
          </Text>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#21180f",
  },
  backgroundImage: {
    opacity: 0.24,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(34, 24, 14, 0.78)",
  },
  page: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingVertical: 34,
  },
  hero: {
    maxWidth: 820,
    marginBottom: 24,
  },
  kicker: {
    color: "#c2d08c",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  title: {
    color: "#fff6dd",
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 50,
    marginBottom: 12,
  },
  subtitle: {
    color: "#efe1bd",
    fontSize: 18,
    lineHeight: 28,
    maxWidth: 700,
    marginBottom: 16,
  },
  updated: {
    color: "#cdbb91",
    fontSize: 14,
  },
  errorBox: {
    borderColor: "rgba(245, 174, 106, 0.45)",
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "rgba(71, 36, 24, 0.72)",
    padding: 16,
    marginBottom: 18,
  },
  errorTitle: {
    color: "#ffe0b8",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 8,
  },
  errorText: {
    color: "#f3d5b5",
    fontSize: 14,
    lineHeight: 21,
  },
  panelGrid: {
    gap: 16,
  },
  panelGridWide: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  panel: {
    flex: 1,
    minWidth: 0,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(92, 74, 47, 0.42)",
    backgroundColor: "rgba(255, 247, 222, 0.93)",
    padding: 18,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 12,
    marginBottom: 14,
  },
  panelTitle: {
    color: "#2f2215",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0,
  },
  panelMeta: {
    color: "#7a603e",
    fontSize: 13,
    fontWeight: "700",
  },
  stateBox: {
    minHeight: 148,
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "rgba(82, 67, 43, 0.08)",
    padding: 18,
  },
  stateText: {
    color: "#72583a",
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
  },
  rankList: {
    gap: 8,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: "rgba(97, 77, 48, 0.09)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rankNumber: {
    width: 24,
    color: "#6f4d2a",
    fontSize: 14,
    fontWeight: "800",
  },
  rankBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    color: "#2f2215",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  cardId: {
    color: "#8b7150",
    fontSize: 12,
    lineHeight: 16,
  },
  drawCount: {
    color: "#2f2215",
    fontSize: 18,
    fontWeight: "900",
    minWidth: 42,
    textAlign: "right",
  },
  footerNote: {
    color: "#d9c89d",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 20,
    textAlign: "center",
  },
});
