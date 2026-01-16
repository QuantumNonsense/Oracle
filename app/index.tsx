import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  cardBackImage,
  cards,
  drawableCards,
  type Card,
} from "../src/decks/defaultDeck";
import { drawNext, shuffle, type DeckState } from "../src/lib/deck";
import CardFlip from "../src/components/CardFlip";
import ShuffleSwirl from "../src/components/ShuffleSwirl";
import ThemedButton from "../src/components/ThemedButton";
import { colors, radii, shadow, spacing, typography } from "../src/theme";

const FAVORITES_KEY = "oracle:favorites";
const LAST_CARD_KEY = "oracle:last-card";
const HISTORY_KEY = "oracle:history:v1";

type HistoryEntry = {
  id: string;
  title: string;
  drawnAt: string;
};

type FanLayout = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type FanSize = {
  w: number;
  h: number;
};

const storage = {
  getItem: async (key: string) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      if (typeof window !== "undefined") {
        return window.localStorage.getItem(key);
      }
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, value);
      }
    }
  },
};

const cardsById = new Map(cards.map((card) => [card.id, card]));

const formatHistoryDate = (value: string) => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch (error) {
    return new Date(value).toLocaleString();
  }
};

export default function Index() {
  const bg = require("../assets/backgrounds/mushroom-field.png");
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [deckState, setDeckState] = useState<DeckState>({
    cards: drawableCards,
    order: [],
    index: 0,
  });
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [isFront, setIsFront] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(
    null
  );
  const [isShuffling, setIsShuffling] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [fanLayout, setFanLayout] = useState<FanLayout | null>(null);
  const [fanSize, setFanSize] = useState<FanSize | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [autoFlipNext, setAutoFlipNext] = useState(false);
  const fanRef = useRef<View | null>(null);
  const selectionAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadState = async () => {
      const [storedFavorites, storedLast, storedHistory] = await Promise.all([
        storage.getItem(FAVORITES_KEY),
        storage.getItem(LAST_CARD_KEY),
        storage.getItem(HISTORY_KEY),
      ]);

      if (storedFavorites) {
        try {
          const parsed = JSON.parse(storedFavorites) as Record<string, boolean>;
          setFavorites(parsed);
        } catch (error) {
          setFavorites({});
        }
      }

      // Intentionally ignore stored last card so the fan is shown on load.

      if (storedHistory) {
        try {
          const parsed = JSON.parse(storedHistory) as HistoryEntry[];
          setHistory(parsed);
        } catch (error) {
          setHistory([]);
        }
      }
    };

    void loadState();
  }, []);

  const recordHistory = useCallback((card: Card) => {
    setHistory((prev) => {
      const next = [
        { id: card.id, title: card.title, drawnAt: new Date().toISOString() },
        ...prev,
      ].slice(0, 200);
      void storage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const persistLastCard = useCallback((card: Card) => {
    void storage.setItem(LAST_CARD_KEY, card.id);
  }, []);

  const persistFavorites = useCallback((next: Record<string, boolean>) => {
    void storage.setItem(FAVORITES_KEY, JSON.stringify(next));
  }, []);

  const drawNextCard = useCallback(
    (autoFlip = false) => {
      setAutoFlipNext(autoFlip);
      setDeckState((prev) => {
        const result = drawNext(prev);
        setCurrentCard(result.card);
        recordHistory(result.card);
        persistLastCard(result.card);
        return result.state;
      });
      setIsFront(!autoFlip);
    },
    [persistLastCard, recordHistory]
  );

  useEffect(() => {
    if (!currentCard || !autoFlipNext) {
      return;
    }
    const timeout = setTimeout(() => {
      setIsFront(true);
      setAutoFlipNext(false);
    }, 140);
    return () => clearTimeout(timeout);
  }, [autoFlipNext, currentCard]);

  const shuffleDeck = useCallback(() => {
    setDeckState((prev) => ({
      ...prev,
      order: shuffle(prev.cards),
      index: 0,
    }));
    setIsFront(false);
    setCurrentCard(null);
    setSelectedSlot(null);
  }, []);

  const handleShufflePress = useCallback(() => {
    if (isShuffling) {
      return;
    }
    const node = fanRef.current;
    if (node?.measureInWindow) {
      // Always use window coordinates for the overlay anchor.
      node.measureInWindow((x, y, w, h) => {
        setFanLayout({ x, y, w, h });
        setIsShuffling(true);
      });
      return;
    }
    if (fanSize) {
      setFanLayout({ x: 0, y: 0, w: fanSize.w, h: fanSize.h });
    }
    setIsShuffling(true);
  }, [fanSize, isShuffling]);

  const handleShuffleDone = useCallback(() => {
    shuffleDeck();
    setIsShuffling(false);
  }, [shuffleDeck]);

  const handleFlip = useCallback(() => {
    if (!currentCard) {
      drawNextCard(true);
      return;
    }
    setIsFront((prev) => !prev);
  }, [currentCard, drawNextCard]);

  const handleSelectFromFan = useCallback(
    (slotIndex: number) => {
      if (isConfirmOpen || isShuffling) {
        return;
      }
      setSelectedSlot(slotIndex);
      setIsConfirmOpen(true);
      Animated.timing(selectionAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [isConfirmOpen, isShuffling, selectionAnim]
  );

  const handleConfirmSelection = useCallback(
    (confirmed: boolean) => {
      if (confirmed) {
        selectionAnim.setValue(0);
        setIsConfirmOpen(false);
        setSelectedSlot(null);
        drawNextCard(true);
        return;
      }
      Animated.timing(selectionAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setIsConfirmOpen(false);
        setSelectedSlot(null);
      });
    },
    [drawNextCard, selectionAnim]
  );

  const toggleFavorite = useCallback(() => {
    if (!currentCard || currentCard.type !== "card") {
      return;
    }
    setFavorites((prev) => {
      const next = { ...prev, [currentCard.id]: !prev[currentCard.id] };
      persistFavorites(next);
      return next;
    });
  }, [currentCard, persistFavorites]);

  const confirmClearHistory = useCallback(() => {
    const runClear = () => {
      setHistory([]);
      void storage.setItem(HISTORY_KEY, JSON.stringify([]));
    };

    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        if (window.confirm("Clear your history?")) {
          runClear();
        }
      } else {
        runClear();
      }
      return;
    }

    Alert.alert("Clear History", "This will remove all saved draws.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: runClear },
    ]);
  }, []);

  const isFavorite =
    currentCard && currentCard.type === "card"
      ? favorites[currentCard.id]
      : false;
  const canFavorite = currentCard?.type === "card";
  const formattedHistory = useMemo(
    () =>
      history.map((entry) => ({
        ...entry,
        formatted: formatHistoryDate(entry.drawnAt),
      })),
    [history]
  );
  const cardWidth = useMemo(() => {
    const available = windowWidth - spacing.lg * 2;
    return Math.min(available, 340);
  }, [windowWidth]);
  const fanCardWidth = useMemo(
    () => Math.min(cardWidth * 0.55, 160),
    [cardWidth]
  );
  const fanCardHeight = useMemo(() => fanCardWidth * 1.5, [fanCardWidth]);
  const fanHeight = useMemo(
    () => fanCardHeight + spacing.lg * 2.25,
    [fanCardHeight]
  );
  const fanSpacerHeight = useMemo(
    () => fanCardHeight * 0.2 + spacing.sm,
    [fanCardHeight]
  );
  const controlsOffset = useMemo(
    () => Math.min(windowHeight * 0.25, 180),
    [windowHeight]
  );
  const selectedCard = selectedHistoryId
    ? cardsById.get(selectedHistoryId) ?? null
    : null;
  const selectedEntry = selectedHistoryId
    ? history.find((entry) => entry.id === selectedHistoryId) ?? null
    : null;
  const renderHistoryItem = useCallback(
    ({ item }: { item: HistoryEntry & { formatted: string } }) => {
      const rowCard = cardsById.get(item.id) ?? null;
      return (
        <Pressable
          style={styles.historyCell}
          onPress={() => setSelectedHistoryId(item.id)}
          accessibilityLabel={`View history card: ${item.title}, drawn ${item.formatted}`}
        >
          <View style={styles.historyThumb}>
            {rowCard ? (
              <Image source={rowCard.image} style={styles.historyThumbImage} />
            ) : (
              <View style={styles.thumbnailFallback} />
            )}
          </View>
          <Text style={styles.historyTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.historyDate} numberOfLines={1}>
            {item.formatted}
          </Text>
        </Pressable>
      );
    },
    [setSelectedHistoryId]
  );

  return (
    <ImageBackground
      source={bg}
      style={styles.bg}
      imageStyle={styles.bgImg}
      resizeMode="cover"
      onLoad={() => console.log("BG LOADED")}
      onError={(event) => console.log("BG ERROR", event?.nativeEvent)}
    >
      <View pointerEvents="none" style={styles.bgTint} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
      >
        <Text style={styles.title}>Today's pull</Text>
        <Text style={styles.subtitle}>Tap the card to reveal your draw.</Text>

        {currentCard ? (
          <CardFlip
            onBeforeFlip={handleFlip}
            isFront={isFront}
            front={
              <Image source={currentCard.image} style={styles.cardImage} />
            }
            back={<Image source={cardBackImage} style={styles.cardImage} />}
            style={styles.cardArea}
          />
        ) : (
          <>
            <View
              ref={fanRef}
              onLayout={(event) => {
                const { width, height } = event.nativeEvent.layout;
                setFanSize({ w: width, h: height });
              }}
              pointerEvents={isShuffling ? "none" : "auto"}
              style={[
                styles.fanArea,
                { height: fanHeight, opacity: isShuffling ? 0 : 1 },
              ]}
            >
              {Array.from({ length: 8 }).map((_, index) => {
                const virtualIndex = index + 1;
                const center = 4.5;
                const offsetFromCenter = virtualIndex - center;
                const rotation = 12 - (24 / 9) * virtualIndex;
                const offsetX = offsetFromCenter * fanCardWidth * 0.18;
                const offsetY = -Math.abs(offsetFromCenter) * 6;
                const isSelected = selectedSlot === index;
                const liftY = Animated.multiply(
                  selectionAnim,
                  fanCardHeight * 0.2
                );
                const liftScale = Animated.add(
                  1,
                  Animated.multiply(selectionAnim, 0.08)
                );
                return (
                  <Pressable
                    key={`fan-card-${index}`}
                    onPress={() => handleSelectFromFan(index)}
                    accessibilityRole="button"
                    accessibilityLabel={`Pick card ${index + 1}`}
                  >
                    <Animated.View
                      style={[
                        styles.fanCard,
                        {
                          width: fanCardWidth,
                          height: fanCardHeight,
                          zIndex: isSelected ? 20 : index,
                          transform: [
                            { translateX: offsetX - fanCardWidth / 2 },
                            { translateY: spacing.md - 25 },
                            { translateY: offsetY },
                            { rotate: `${rotation}deg` },
                            ...(isSelected
                              ? [{ translateY: liftY }, { scale: liftScale }]
                              : []),
                          ],
                        },
                      ]}
                    >
                      <Image
                        source={cardBackImage}
                        style={styles.fanCardImage}
                      />
                    </Animated.View>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ height: fanSpacerHeight }} />
          </>
        )}

        <View
          style={[styles.controls, { marginTop: spacing.sm + controlsOffset }]}
        >
          <ThemedButton
            label="Shuffle"
            onPress={handleShufflePress}
            variant="secondary"
            disabled={isShuffling}
          />
          <ThemedButton
            label={isFavorite ? "Remove Favorite" : "Add to Favorites"}
            onPress={toggleFavorite}
            variant="secondary"
            disabled={!canFavorite}
            style={styles.favoriteButton}
          />
          <ThemedButton
            label="Your History"
            onPress={() => setIsHistoryOpen(true)}
            variant="secondary"
            style={styles.historyButton}
          />
        </View>

        <Modal transparent visible={isHistoryOpen} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Your History</Text>
                <ThemedButton
                  label="Close"
                  onPress={() => {
                    setSelectedHistoryId(null);
                    setIsHistoryOpen(false);
                  }}
                  variant="ghost"
                  style={styles.modalCloseButton}
                />
              </View>
              {formattedHistory.length === 0 ? (
                <Text style={styles.modalEmpty}>No cards drawn yet.</Text>
              ) : (
                <FlatList
                  data={formattedHistory}
                  renderItem={renderHistoryItem}
                  keyExtractor={(item) => `${item.id}-${item.drawnAt}`}
                  numColumns={3}
                  columnWrapperStyle={styles.historyRow}
                  contentContainerStyle={styles.historyGrid}
                  showsVerticalScrollIndicator={false}
                  style={styles.modalList}
                />
              )}
              <ThemedButton
                label="Clear History"
                onPress={confirmClearHistory}
                variant="ghost"
                style={styles.clearButton}
              />
            </View>
          </View>
        </Modal>

        <Modal
          transparent
          visible={selectedHistoryId !== null}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {selectedCard && selectedEntry ? (
                <ScrollView contentContainerStyle={styles.detailContent}>
                  <Text style={styles.modalTitle}>{selectedCard.title}</Text>
                  <Text style={styles.modalSubtitle}>
                    {formatHistoryDate(selectedEntry.drawnAt)}
                  </Text>
                  <View style={styles.detailImageWrap}>
                    <Image
                      source={selectedCard.image}
                      style={styles.detailImage}
                    />
                  </View>
                </ScrollView>
              ) : (
                <Text style={styles.modalEmpty}>Card image not available.</Text>
              )}
              <ThemedButton
                label="Back"
                onPress={() => setSelectedHistoryId(null)}
                variant="ghost"
                style={styles.modalCloseButton}
              />
            </View>
          </View>
        </Modal>

        <Modal transparent visible={isConfirmOpen} animationType="fade">
          <View style={styles.confirmOverlay}>
            <View style={[styles.modalCard, styles.confirmCard]}>
              <Text style={[styles.modalTitle, styles.confirmTitle]}>
                Confirm your pick
              </Text>
              <Text style={[styles.modalSubtitle, styles.confirmSubtitle]}>
                Are you sure this is the card you want?
              </Text>
              <View style={styles.confirmActions}>
                <ThemedButton
                  label="Yes"
                  onPress={() => handleConfirmSelection(true)}
                />
                <ThemedButton
                  label="No"
                  onPress={() => handleConfirmSelection(false)}
                  variant="secondary"
                />
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
      <ShuffleSwirl
        visible={isShuffling}
        onDone={handleShuffleDone}
        cardWidth={fanCardWidth}
        size={fanCardWidth * 2.1}
        anchor={fanLayout}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  bgImg: {
    width: "100%",
    height: "100%",
  },
  bgTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(18,16,36,0.18)",
  },
  screen: {
    backgroundColor: "transparent",
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: "transparent",
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  subtitle: {
    color: colors.muted,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    textAlign: "center",
    fontSize: typography.subtitle,
  },
  cardArea: {
    width: "100%",
    marginBottom: spacing.md,
  },
  fanArea: {
    width: "100%",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    marginTop: -25,
  },
  fanCard: {
    position: "absolute",
    left: "50%",
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceAlt,
  },
  fanCardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  controls: {
    width: "100%",
    maxWidth: 360,
    gap: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: "rgba(18,16,36,0.35)",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  favoriteButton: {
    backgroundColor: colors.accentPeach,
  },
  historyButton: {
    backgroundColor: colors.accentLavender,
  },
  confirmActions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(18, 16, 36, 0.72)",
    alignItems: "center",
    padding: spacing.lg,
    paddingTop: spacing.xl * 1.5,
  },
  confirmCard: {
    maxWidth: 420,
  },
  confirmTitle: {
    textAlign: "center",
  },
  confirmSubtitle: {
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(18, 16, 36, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalCard: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.soft,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  modalTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 18,
  },
  modalSubtitle: {
    color: colors.textSoft,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  modalList: {
    maxHeight: 320,
  },
  historyGrid: {
    paddingBottom: spacing.sm,
  },
  historyRow: {
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  historyCell: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: spacing.xs,
  },
  historyThumb: {
    width: 62,
    height: 86,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
    marginBottom: spacing.xs,
  },
  historyThumbImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  historyTitle: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 12,
  },
  historyDate: {
    color: colors.textSoft,
    fontSize: 10,
  },
  modalEmpty: {
    color: colors.textSoft,
    textAlign: "center",
    paddingVertical: spacing.md,
  },
  thumbnailFallback: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
  },
  modalCloseButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  clearButton: {
    marginTop: spacing.sm,
    borderColor: colors.accentPeach,
  },
  detailContent: {
    alignItems: "center",
    paddingBottom: spacing.md,
  },
  detailImageWrap: {
    width: "100%",
    maxWidth: 340,
    aspectRatio: 2 / 3,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  detailImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
});
