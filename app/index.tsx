import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
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
  const { width: windowWidth } = useWindowDimensions();
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
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);

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

      if (storedLast) {
        const match = cardsById.get(storedLast) ?? null;
        if (match) {
          setCurrentCard(match);
          setIsFront(false);
        }
      }

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

  const drawNextCard = useCallback(() => {
    setDeckState((prev) => {
      const result = drawNext(prev);
      setCurrentCard(result.card);
      setIsFront(true);
      recordHistory(result.card);
      persistLastCard(result.card);
      return result.state;
    });
  }, [persistLastCard, recordHistory]);

  const shuffleDeck = useCallback(() => {
    setDeckState((prev) => ({
      ...prev,
      order: shuffle(prev.cards),
      index: 0,
    }));
    setIsFront(false);
    setCurrentCard(null);
  }, []);

  const handleShufflePress = useCallback(() => {
    if (isShuffling) {
      return;
    }
    setIsShuffling(true);
  }, [isShuffling]);

  const handleShuffleDone = useCallback(() => {
    shuffleDeck();
    setIsShuffling(false);
  }, [shuffleDeck]);

  const handleFlip = useCallback(() => {
    if (!currentCard) {
      drawNextCard();
      return;
    }
    setIsFront((prev) => !prev);
  }, [currentCard, drawNextCard]);

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

    Alert.alert(
      "Clear History",
      "This will remove all saved draws.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: runClear },
      ]
    );
  }, []);

  const isFavorite =
    currentCard && currentCard.type === "card" ? favorites[currentCard.id] : false;
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
  const selectedCard = selectedHistoryId ? cardsById.get(selectedHistoryId) ?? null : null;
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
      <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
        <Text style={styles.title}>Today's pull</Text>
        <Text style={styles.subtitle}>Tap the card to reveal your draw.</Text>

        <CardFlip
          onBeforeFlip={handleFlip}
          isFront={isFront}
          front={
            currentCard ? (
              <Image source={currentCard.image} style={styles.cardImage} />
            ) : (
              <Image source={cardBackImage} style={styles.cardImage} />
            )
          }
          back={<Image source={cardBackImage} style={styles.cardImage} />}
          style={styles.cardArea}
        />

        <View style={styles.controls}>
          <ThemedButton label="Draw Next" onPress={drawNextCard} />
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

        <Modal transparent visible={selectedHistoryId !== null} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {selectedCard && selectedEntry ? (
                <ScrollView contentContainerStyle={styles.detailContent}>
                  <Text style={styles.modalTitle}>{selectedCard.title}</Text>
                  <Text style={styles.modalSubtitle}>
                    {formatHistoryDate(selectedEntry.drawnAt)}
                  </Text>
                  <View style={styles.detailImageWrap}>
                    <Image source={selectedCard.image} style={styles.detailImage} />
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
      </ScrollView>
      <ShuffleSwirl
        visible={isShuffling}
        onDone={handleShuffleDone}
        cardWidth={cardWidth}
        size={cardWidth * 1.15}
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
