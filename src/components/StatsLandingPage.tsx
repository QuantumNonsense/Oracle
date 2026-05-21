import { useEffect, useMemo, useState } from "react";
import {
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { cardBackImage, cards } from "../decks/defaultDeck";
import { CARD_HEIGHT_RATIO } from "../lib/cardLayout";
import {
  getCardDrawBreakdown,
  getCardDrawCounts,
  type CardDrawBreakdown,
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
  key: StatsRangeKey;
  label: string;
  rangeStart: string;
  rangeEnd: string;
  data: CardDrawCount[];
};

type SelectedCardState = {
  item: CardDrawCount;
  range: RangeState;
  title: string;
};

type BreakdownState =
  | { status: "idle"; data: CardDrawBreakdown[]; message?: undefined }
  | { status: "loading"; data: CardDrawBreakdown[]; message?: undefined }
  | { status: "ready"; data: CardDrawBreakdown[]; message?: undefined }
  | { status: "error"; data: CardDrawBreakdown[]; message: string };

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
const PANEL_LIST_MAX_HEIGHT = 460;

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

const createRangeState = (
  range: StatsRange,
  data: CardDrawCount[] = [],
): RangeState => ({
  key: range.key,
  label: range.label,
  rangeStart: range.start.toISOString(),
  rangeEnd: range.end.toISOString(),
  data,
});

const createEmptyRanges = () =>
  buildRanges(new Date()).map((range) => createRangeState(range));

const formatSelectionSlot = (slot: number | null) =>
  slot === null ? "Unknown slot" : `Slot ${slot + 1}`;

const formatDrawMode = (drawMode: string) =>
  drawMode.length > 0
    ? `${drawMode.charAt(0).toUpperCase()}${drawMode.slice(1)}`
    : "Unknown";

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
  onSelectCard,
  range,
}: {
  data: CardDrawCount[];
  isLoading: boolean;
  label: string;
  onSelectCard: (item: CardDrawCount, range: RangeState) => void;
  range: RangeState;
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
        <ScrollView
          style={styles.rankScroll}
          contentContainerStyle={styles.rankList}
          nestedScrollEnabled
          showsVerticalScrollIndicator
        >
          {data.slice(0, TOP_CARD_LIMIT).map((item, index) => {
            const card = getStatsCard(item);
            return (
              <Pressable
                accessibilityRole="button"
                key={`${item.cardId}-${index}`}
                onPress={() => onSelectCard(item, range)}
                style={({ pressed }) => [
                  styles.rankRow,
                  index === 0 && styles.rankRowTop,
                  pressed && styles.rankRowPressed,
                ]}
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
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const CardBreakdownModal = ({
  breakdown,
  onClose,
  selected,
}: {
  breakdown: BreakdownState;
  onClose: () => void;
  selected: SelectedCardState | null;
}) => {
  const card = selected ? cardsById.get(selected.item.cardId) : null;
  const total = selected?.item.drawCount ?? 0;

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={Boolean(selected)}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={styles.modalCard}
        >
          <View style={styles.modalHeader}>
            <View style={styles.modalThumbFrame}>
              <Image
                source={card?.image ?? cardBackImage}
                style={styles.modalThumb}
                resizeMode="cover"
              />
            </View>
            <View style={styles.modalTitleGroup}>
              <Text style={styles.modalEyebrow}>
                {selected?.range.label ?? "Card details"}
              </Text>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {selected?.title ?? "Card"}
              </Text>
              <Text style={styles.modalSubtitle}>
                {total.toLocaleString()} {total === 1 ? "draw" : "draws"}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Close card details"
              accessibilityRole="button"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>

          <View style={styles.breakdownContent}>
            {breakdown.status === "loading" ? (
              <View style={styles.modalStateBox}>
                <Text style={styles.modalStateText}>
                  Loading the aggregate breakdown.
                </Text>
              </View>
            ) : breakdown.status === "error" ? (
              <View style={styles.modalErrorBox}>
                <Text style={styles.modalErrorTitle}>
                  Breakdown unavailable
                </Text>
                <Text style={styles.modalErrorText}>{breakdown.message}</Text>
              </View>
            ) : breakdown.data.length === 0 ? (
              <View style={styles.modalStateBox}>
                <Text style={styles.modalStateText}>
                  No grouped detail is available for this card yet.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.breakdownScroll}
                contentContainerStyle={styles.breakdownList}
                showsVerticalScrollIndicator
              >
                {breakdown.data.map((item, index) => (
                  <View
                    key={`${item.selectionSlot}-${item.drawMode}-${item.clientTimezone}-${index}`}
                    style={styles.breakdownRow}
                  >
                    <View style={styles.breakdownMain}>
                      <Text style={styles.breakdownSlot}>
                        {formatSelectionSlot(item.selectionSlot)}
                      </Text>
                      <Text style={styles.breakdownMeta} numberOfLines={1}>
                        {formatDrawMode(item.drawMode)} draw
                      </Text>
                      <Text style={styles.breakdownTimezone} numberOfLines={1}>
                        {item.clientTimezone ?? "Unknown timezone"}
                      </Text>
                    </View>
                    <View style={styles.breakdownCountPill}>
                      <Text style={styles.breakdownCount}>
                        {item.drawCount.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          <Text style={styles.modalFooterNote}>
            Grouped public counts only. Individual draw events are not shown.
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default function StatsLandingPage() {
  const { height, width } = useWindowDimensions();
  const [state, setState] = useState<LoadState>({
    status: "loading",
    ranges: createEmptyRanges(),
    lastUpdated: null,
  });
  const [selectedCard, setSelectedCard] = useState<SelectedCardState | null>(
    null,
  );
  const [breakdownState, setBreakdownState] = useState<BreakdownState>({
    status: "idle",
    data: [],
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
        ranges: ranges.map((range) => createRangeState(range)),
      }));

      try {
        const results = await Promise.all(
          ranges.map(async (range) => {
            const data = await getCardDrawCounts({
              rangeStart: range.start.toISOString(),
              rangeEnd: range.end.toISOString(),
              targetDeckId: DECK_ID,
            });
            return createRangeState(range, data);
          }),
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
          ranges: ranges.map((range) => createRangeState(range)),
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

  useEffect(() => {
    if (!selectedCard) {
      setBreakdownState({ status: "idle", data: [] });
      return;
    }

    let isMounted = true;
    setBreakdownState({ status: "loading", data: [] });

    const loadBreakdown = async () => {
      try {
        const data = await getCardDrawBreakdown({
          cardId: selectedCard.item.cardId,
          rangeStart: selectedCard.range.rangeStart,
          rangeEnd: selectedCard.range.rangeEnd,
          targetDeckId: DECK_ID,
        });

        if (!isMounted) {
          return;
        }

        setBreakdownState({ status: "ready", data });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setBreakdownState({
          status: "error",
          data: [],
          message:
            error instanceof Error
              ? error.message
              : "The grouped draw details could not be loaded.",
        });
      }
    };

    void loadBreakdown();

    return () => {
      isMounted = false;
    };
  }, [selectedCard]);

  const handleSelectCard = (item: CardDrawCount, range: RangeState) => {
    setSelectedCard({
      item,
      range,
      title: getDisplayTitle(item),
    });
  };

  const closeBreakdown = () => {
    setSelectedCard(null);
  };

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
                onSelectCard={handleSelectCard}
                range={range}
              />
            ))}
          </View>

          <Text style={styles.footerNote}>
            Aggregate public counts only. Individual draw events are not shown.
          </Text>
        </ScrollView>

        <CardBreakdownModal
          breakdown={breakdownState}
          onClose={closeBreakdown}
          selected={selectedCard}
        />
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
  rankScroll: {
    maxHeight: PANEL_LIST_MAX_HEIGHT,
  },
  rankList: {
    gap: 8,
    paddingRight: 4,
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
  rankRowPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.995 }],
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
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(19, 12, 7, 0.76)",
    paddingHorizontal: 18,
    paddingVertical: 28,
  },
  modalCard: {
    width: "100%",
    maxWidth: 680,
    maxHeight: "92%",
    alignSelf: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(241, 220, 170, 0.72)",
    backgroundColor: "#fff4d8",
    padding: 18,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  modalThumbFrame: {
    width: 74,
    height: Math.round(74 * CARD_HEIGHT_RATIO),
    flexShrink: 0,
    overflow: "hidden",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(47, 34, 21, 0.5)",
    backgroundColor: "#3f2b19",
  },
  modalThumb: {
    width: "100%",
    height: "100%",
  },
  modalTitleGroup: {
    flex: 1,
    minWidth: 0,
  },
  modalEyebrow: {
    color: "#7a5d35",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  modalTitle: {
    color: "#2f2215",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 32,
  },
  modalSubtitle: {
    color: "#80633d",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
  closeButton: {
    alignSelf: "flex-start",
    borderRadius: 8,
    backgroundColor: "rgba(65, 45, 24, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeButtonText: {
    color: "#3b2917",
    fontSize: 13,
    fontWeight: "900",
  },
  breakdownContent: {
    borderRadius: 8,
    backgroundColor: "rgba(98, 74, 43, 0.08)",
    padding: 10,
  },
  breakdownScroll: {
    maxHeight: 360,
  },
  breakdownList: {
    gap: 8,
    paddingRight: 4,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(92, 70, 40, 0.12)",
    backgroundColor: "rgba(255, 248, 226, 0.72)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  breakdownMain: {
    flex: 1,
    minWidth: 0,
  },
  breakdownSlot: {
    color: "#2f2215",
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
  },
  breakdownMeta: {
    color: "#6f4d2a",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
  breakdownTimezone: {
    color: "#8b7150",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  breakdownCountPill: {
    minWidth: 54,
    borderRadius: 8,
    backgroundColor: "rgba(65, 45, 24, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  breakdownCount: {
    color: "#2f2215",
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 22,
  },
  modalStateBox: {
    minHeight: 132,
    justifyContent: "center",
    padding: 18,
  },
  modalStateText: {
    color: "#72583a",
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
  },
  modalErrorBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(157, 72, 49, 0.3)",
    backgroundColor: "rgba(99, 44, 30, 0.12)",
    padding: 14,
  },
  modalErrorTitle: {
    color: "#66321f",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6,
  },
  modalErrorText: {
    color: "#724933",
    fontSize: 13,
    lineHeight: 20,
  },
  modalFooterNote: {
    color: "#80633d",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 12,
    textAlign: "center",
  },
});
