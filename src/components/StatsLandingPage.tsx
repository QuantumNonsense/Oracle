import { useEffect, useMemo, useState } from "react";
import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { cardBackImage, cards } from "../decks/defaultDeck";
import { CARD_HEIGHT_RATIO } from "../lib/cardLayout";
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
const CARD_THUMB_WIDTH = 46;
const CARD_THUMB_HEIGHT = Math.round(CARD_THUMB_WIDTH * CARD_HEIGHT_RATIO);

const cardTitlesById = new Map(cards.map((card) => [card.id, card.title]));
const cardsById = new Map(cards.map((card) => [card.id, card]));

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

const getStatsCard = (item: CardDrawCount) => cardsById.get(item.cardId);

const getDrawTotal = (data: CardDrawCount[]) =>
  data.reduce((total, item) => total + item.drawCount, 0);

const createEmptyRanges = () =>
  buildRanges(new Date()).map((range) => ({ label: range.label, data: [] }));

const SummaryStrip = ({
  isLoading,
  isWide,
  ranges,
}: {
  isLoading: boolean;
  isWide: boolean;
  ranges: RangeState[];
}) => (
  <View style={[styles.summaryGrid, isWide && styles.summaryGridWide]}>
    {ranges.map((range) => {
      const total = getDrawTotal(range.data);
      return (
        <View key={range.label} style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{range.label}</Text>
          <Text style={styles.summaryValue}>
            {isLoading ? "..." : total.toLocaleString()}
          </Text>
          <Text style={styles.summaryCaption}>
            {isLoading
              ? "loading snapshot"
              : total === 1
                ? "global draw"
                : "global draws"}
          </Text>
        </View>
      );
    })}
  </View>
);

const StatsPanel = ({
  data,
  isLoading,
  label,
}: {
  data: CardDrawCount[];
  isLoading: boolean;
  label: string;
}) => {
  const total = getDrawTotal(data);

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <View style={styles.panelTitleGroup}>
          <Text style={styles.panelTitle}>{label}</Text>
          <Text style={styles.panelSubtitle}>
            {isLoading
              ? "Loading"
              : `${total.toLocaleString()} ${total === 1 ? "draw" : "draws"}`}
          </Text>
        </View>
        <Text style={styles.panelMeta}>Top {TOP_CARD_LIMIT}</Text>
      </View>

      {isLoading ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>
            Gathering the current draw pattern.
          </Text>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>No global draws recorded yet.</Text>
        </View>
      ) : (
        <View style={styles.rankList}>
          {data.slice(0, TOP_CARD_LIMIT).map((item, index) => {
            const card = getStatsCard(item);
            return (
              <View
                key={`${item.cardId}-${index}`}
                style={[styles.rankRow, index === 0 && styles.rankRowTop]}
              >
                <Text style={styles.rankNumber}>{index + 1}</Text>
                <View style={styles.thumbnailFrame}>
                  <Image
                    source={card?.image ?? cardBackImage}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.rankBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {getDisplayTitle(item)}
                  </Text>
                  <Text style={styles.cardId} numberOfLines={1}>
                    {item.cardId}
                  </Text>
                </View>
                <View style={styles.countPill}>
                  <Text style={styles.drawCount}>
                    {item.drawCount.toLocaleString()}
                  </Text>
                  <Text style={styles.drawLabel}>
                    {item.drawCount === 1 ? "draw" : "draws"}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

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

          <SummaryStrip
            isLoading={state.status === "loading"}
            isWide={isWide}
            ranges={state.ranges}
          />

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
    opacity: 0.3,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(30, 20, 11, 0.72)",
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
    marginBottom: 18,
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
  summaryGrid: {
    gap: 12,
    marginBottom: 18,
  },
  summaryGridWide: {
    flexDirection: "row",
  },
  summaryCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(228, 186, 116, 0.22)",
    backgroundColor: "rgba(66, 43, 23, 0.72)",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  summaryLabel: {
    color: "#d4e09f",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  summaryValue: {
    color: "#fff6dd",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 36,
  },
  summaryCaption: {
    color: "#d8c59b",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
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
    borderColor: "rgba(241, 220, 170, 0.7)",
    backgroundColor: "rgba(255, 248, 226, 0.96)",
    padding: 18,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  panelTitleGroup: {
    flex: 1,
    minWidth: 0,
  },
  panelTitle: {
    color: "#2f2215",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0,
  },
  panelSubtitle: {
    color: "#80633d",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  panelMeta: {
    color: "#5d3d1f",
    fontSize: 13,
    fontWeight: "700",
    borderRadius: 999,
    backgroundColor: "rgba(137, 96, 48, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
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
    gap: 10,
    minHeight: 66,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(92, 70, 40, 0.1)",
    backgroundColor: "rgba(98, 74, 43, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  rankRowTop: {
    borderColor: "rgba(147, 103, 41, 0.28)",
    backgroundColor: "rgba(144, 102, 43, 0.14)",
  },
  rankNumber: {
    width: 22,
    color: "#6f4d2a",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  thumbnailFrame: {
    width: CARD_THUMB_WIDTH,
    height: CARD_THUMB_HEIGHT,
    overflow: "hidden",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(47, 34, 21, 0.42)",
    backgroundColor: "#3f2b19",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
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
  countPill: {
    minWidth: 54,
    borderRadius: 8,
    backgroundColor: "rgba(65, 45, 24, 0.12)",
    paddingHorizontal: 9,
    paddingVertical: 6,
    alignItems: "center",
  },
  drawCount: {
    color: "#2f2215",
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 20,
    textAlign: "center",
  },
  drawLabel: {
    color: "#80633d",
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 13,
    textTransform: "uppercase",
  },
  footerNote: {
    color: "#d9c89d",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 20,
    textAlign: "center",
  },
});
