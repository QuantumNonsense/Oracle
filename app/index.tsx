import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useFonts } from "expo-font";
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  ImageBackground,
  InteractionManager,
  Modal,
  PixelRatio,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  cardBackImage,
  cards,
  drawableCards,
  type Card,
} from "../src/decks/defaultDeck";
import { drawNext, shuffle, type DeckState } from "../src/lib/deck";
import { getFanSlots } from "../src/lib/fanLayout";
import CardFlip from "../src/components/CardFlip";
import ThemedButton from "../src/components/ThemedButton";
import { colors, radii, shadow, spacing, typography } from "../src/theme";

const SHUFFLE_TIMING = {
  COLLAPSE_DURATION: 550,
  HOLD_BEFORE_SHAKE: 40,
  SHAKE_DURATION: 1,
  HOLD_AFTER_SHAKE: 40,
  SWIRL_DURATION: 800,
  SWIRL_RESET_DURATION: 1,
  EXPAND_DURATION: 550,
} as const;
const SHUFFLE_SHAKE_STEPS = 6;
const SHUFFLE_SWIRL_STEPS = 8;
const CARD_FLIP_DURATION_MS = 380;
const DETAIL_TEXT_BLANK_MS = 200;
const DETAIL_TEXT_LINE_REVEAL_MS = 1400;
const DETAIL_TEXT_LINE_STAGGER_MS = 220;

const FAVORITES_KEY = "oracle:favorites";
const LAST_CARD_KEY = "oracle:last-card";
const HISTORY_KEY = "oracle:history:v1";
const JOURNAL_KEY = "oracle:journals:v1";

type HistoryEntry = {
  id: string;
  title: string;
  drawnAt: string;
};

type FanSize = {
  w: number;
  h: number;
};

type LayoutFrame = {
  y: number;
  height: number;
};

type FlipPair = {
  back: ReactNode;
  front: ReactNode;
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
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const appFontFamily = Platform.select({
  ios: "TudorRose",
  android: "TudorRose",
  default:
    "'TudorRose', 'Noteworthy', 'Comic Sans MS', 'Brush Script MT', cursive",
});
const detailFontFamily = appFontFamily;
const detailFontFamilyBold = appFontFamily;

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

const buildDetailLines = (card: Card | null) => {
  if (!card) {
    return [];
  }
  const lines: Array<{
    key: string;
    type: "title" | "body" | "heading" | "bullet";
    text: string;
  }> = [
    {
      key: `title-${card.id}`,
      type: "title",
      text: card.title,
    },
  ];
  (card.description ?? []).forEach((paragraph, index) => {
    lines.push({
      key: `desc-${card.id}-${index}`,
      type: "body",
      text: paragraph,
    });
  });
  if (card.reflectionQuestions && card.reflectionQuestions.length > 0) {
    lines.push({
      key: `rq-heading-${card.id}`,
      type: "heading",
      text: "Reflection Questions",
    });
    card.reflectionQuestions.forEach((question, index) => {
      lines.push({
        key: `rq-${card.id}-${index}`,
        type: "bullet",
        text: `~${question}`,
      });
    });
  }
  return lines;
};

export default function Index() {
  const [fontsLoaded] = useFonts({
    TudorRose: require("../assets/TudorRose.otf"),
  });
  const bg = require("../assets/backgrounds/mushroom-field.png");
  const shuffleImage = require("../assets/Shuffle.png");
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [deckState, setDeckState] = useState<DeckState>({
    cards: drawableCards,
    order: [],
    index: 0,
  });
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [isFront, setIsFront] = useState(false);
  const [flipPair, setFlipPair] = useState<FlipPair | null>(null);
  const [isDetailMode, setIsDetailMode] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [journalEntries, setJournalEntries] = useState<Record<string, string>>(
    {},
  );
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [journalDraft, setJournalDraft] = useState("");
  const [isJournalEntriesOpen, setIsJournalEntriesOpen] = useState(false);
  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(
    null,
  );
  const [isJournalCardFront, setIsJournalCardFront] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(
    null,
  );
  const [isShuffling, setIsShuffling] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [fanSize, setFanSize] = useState<FanSize | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [autoFlipNext, setAutoFlipNext] = useState(false);
  const [layoutWidth, setLayoutWidth] = useState<number | null>(null);
  const [bannerLayout, setBannerLayout] = useState<LayoutFrame | null>(null);
  const [fanLayout, setFanLayout] = useState<LayoutFrame | null>(null);
  const lastLayoutWidthRef = useRef<number | null>(null);
  const selectionAnim = useRef(new Animated.Value(0)).current;
  const fanCollapse = useRef(new Animated.Value(0)).current;
  const shuffleShake = useRef(new Animated.Value(0)).current;
  const shuffleSwirl = useRef(new Animated.Value(0)).current;
  const shuffleAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const detailLineAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const detailFlipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const tapHintAnim = useRef(new Animated.Value(0)).current;
  const readMoreAnim = useRef(new Animated.Value(0)).current;
  const detailContentSwapTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const isDetailModeRef = useRef(false);
  const currentCardIdRef = useRef<string | null>(null);
  const backNode = useMemo(
    () => <Image source={cardBackImage} style={styles.cardImage} />,
    [],
  );
  const frontNode = useMemo(() => {
    if (!currentCard) {
      return null;
    }
    return <Image source={currentCard.image} style={styles.cardImage} />;
  }, [currentCard]);
  const detailBgNode = useMemo(() => {
    if (!currentCard?.detailImage) {
      return null;
    }
    return (
      <ImageBackground
        source={currentCard.detailImage}
        style={styles.cardImage}
        imageStyle={styles.cardImage}
      />
    );
  }, [currentCard]);
  const journalEntryList = useMemo(
    () =>
      Object.entries(journalEntries)
        .map(([id, entry]) => ({
          id,
          entry,
          title: cardsById.get(id)?.title ?? "Card",
        }))
        .sort((a, b) => a.title.localeCompare(b.title)),
    [journalEntries],
  );
  const detailLines = useMemo(() => buildDetailLines(currentCard), [currentCard]);

  const detailLineOpacities = useMemo(
    () => detailLines.map(() => new Animated.Value(0)),
    [detailLines.length, currentCard?.id],
  );

  const detailContentNode = useMemo(() => {
    if (!currentCard) {
      return null;
    }
    const titleLine = detailLines[0];
    const bodyLines = detailLines.slice(1);
    const getLineStyle = (index: number) => {
      const opacity = detailLineOpacities[index];
      const translateY = opacity.interpolate({
        inputRange: [0, 1],
        outputRange: [4, 0],
      });
      return { opacity, transform: [{ translateY }] };
    };
    return (
      <View pointerEvents="box-none" style={styles.detailOverlay}>
        <View style={styles.detailHeader}>
          {titleLine ? (
            <Animated.Text style={[styles.detailTitleText, getLineStyle(0)]}>
              {titleLine.text}
            </Animated.Text>
          ) : null}
        </View>
        <ScrollView
          style={styles.detailScroll}
          contentContainerStyle={styles.detailScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {bodyLines.map((line, index) => {
            const lineIndex = index + 1;
            const animatedStyle = getLineStyle(lineIndex);
            if (line.type === "heading") {
              return (
                <Animated.Text
                  key={line.key}
                  style={[styles.detailHeadingText, animatedStyle]}
                >
                  {line.text}
                </Animated.Text>
              );
            }
            if (line.type === "bullet") {
              return (
                <Animated.Text
                  key={line.key}
                  style={[styles.detailBulletText, animatedStyle]}
                >
                  {line.text}
                </Animated.Text>
              );
            }
            return (
              <Animated.Text
                key={line.key}
                style={[styles.detailBodyText, animatedStyle]}
              >
                {line.text}
              </Animated.Text>
            );
          })}
        </ScrollView>
      </View>
    );
  }, [currentCard, detailLines, detailLineOpacities]);
  const detailFullNode = useMemo(() => {
    if (!currentCard?.detailImage) {
      return null;
    }
    return (
      <ImageBackground
        source={currentCard.detailImage}
        style={styles.cardImage}
        imageStyle={styles.cardImage}
      >
        {detailContentNode}
      </ImageBackground>
    );
  }, [currentCard, detailContentNode]);
  const detailOverlayNode = useMemo(() => {
    if (!currentCard?.detailImage) {
      return null;
    }
    return detailContentNode;
  }, [currentCard, detailContentNode]);

  useEffect(() => {
    const loadState = async () => {
      const [storedFavorites, storedLast, storedHistory, storedJournals] =
        await Promise.all([
          storage.getItem(FAVORITES_KEY),
          storage.getItem(LAST_CARD_KEY),
          storage.getItem(HISTORY_KEY),
          storage.getItem(JOURNAL_KEY),
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

      if (storedJournals) {
        try {
          const parsed = JSON.parse(storedJournals) as Record<string, string>;
          setJournalEntries(parsed);
        } catch (error) {
          setJournalEntries({});
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

  const persistJournals = useCallback((next: Record<string, string>) => {
    void storage.setItem(JOURNAL_KEY, JSON.stringify(next));
  }, []);

  const openJournal = useCallback(() => {
    if (!currentCard) {
      return;
    }
    setJournalDraft(journalEntries[currentCard.id] ?? "");
    setIsJournalOpen(true);
  }, [currentCard, journalEntries]);

  const saveJournal = useCallback(() => {
    if (!currentCard) {
      setIsJournalOpen(false);
      return;
    }
    const trimmed = journalDraft.trim();
    setJournalEntries((prev) => {
      if (!trimmed) {
        const { [currentCard.id]: _omit, ...rest } = prev;
        persistJournals(rest);
        return rest;
      }
      const next = { ...prev, [currentCard.id]: trimmed };
      persistJournals(next);
      return next;
    });
    setIsJournalOpen(false);
  }, [currentCard, journalDraft, persistJournals]);

  const resetApp = useCallback(() => {
    shuffleAnimRef.current?.stop();
    detailLineAnimRef.current?.stop();
    if (detailFlipTimeoutRef.current) {
      clearTimeout(detailFlipTimeoutRef.current);
      detailFlipTimeoutRef.current = null;
    }
    if (detailContentSwapTimeoutRef.current) {
      clearTimeout(detailContentSwapTimeoutRef.current);
      detailContentSwapTimeoutRef.current = null;
    }
    shuffleShake.setValue(0);
    shuffleSwirl.setValue(0);
    selectionAnim.setValue(0);
    fanCollapse.setValue(0);
    setDeckState({ cards: drawableCards, order: [], index: 0 });
    setCurrentCard(null);
    setFlipPair(null);
    setIsFront(false);
    setIsDetailMode(false);
    setHistory([]);
    setFavorites({});
    setSelectedHistoryId(null);
    setIsHistoryOpen(false);
    setSelectedSlot(null);
    setIsConfirmOpen(false);
    setAutoFlipNext(false);
    setIsShuffling(false);
    setFanOffsetY(88);
    setIsJournalOpen(false);
    setIsJournalEntriesOpen(false);
    setSelectedJournalId(null);
    setJournalDraft("");
    void storage.setItem(HISTORY_KEY, JSON.stringify([]));
    void storage.setItem(FAVORITES_KEY, JSON.stringify({}));
    void storage.setItem(LAST_CARD_KEY, "");
  }, [fanCollapse, selectionAnim, shuffleShake, shuffleSwirl, shuffleAnimRef]);

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
    [persistLastCard, recordHistory],
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

  useEffect(() => {
    isDetailModeRef.current = isDetailMode;
  }, [isDetailMode]);

  useEffect(() => {
    currentCardIdRef.current = currentCard?.id ?? null;
  }, [currentCard]);

  useEffect(() => {
    if (selectedJournalId) {
      setIsJournalCardFront(true);
    }
  }, [selectedJournalId]);

  useEffect(() => {
    detailLineAnimRef.current?.stop();
    detailLineOpacities.forEach((value) => value.setValue(0));
    if (!isDetailMode || !isFront) {
      return;
    }
    const delay = CARD_FLIP_DURATION_MS + DETAIL_TEXT_BLANK_MS;
    const lineAnimations = detailLineOpacities.map((value) =>
      Animated.timing(value, {
        toValue: 1,
        duration: DETAIL_TEXT_LINE_REVEAL_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    const animation = Animated.sequence([
      Animated.delay(delay),
      Animated.stagger(DETAIL_TEXT_LINE_STAGGER_MS, lineAnimations),
    ]);
    detailLineAnimRef.current = animation;
    animation.start(({ finished }) => {
      if (finished) {
        detailLineAnimRef.current = null;
      }
    });
  }, [
    detailLineOpacities,
    detailLines.length,
    isDetailMode,
    isFront,
    currentCard?.id,
  ]);

  useEffect(() => {
    return () => {
      if (detailFlipTimeoutRef.current) {
        clearTimeout(detailFlipTimeoutRef.current);
        detailFlipTimeoutRef.current = null;
      }
      if (detailContentSwapTimeoutRef.current) {
        clearTimeout(detailContentSwapTimeoutRef.current);
        detailContentSwapTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!currentCard) {
      setFlipPair(null);
      setIsFront(false);
      setIsDetailMode(false);
      return;
    }
    if (frontNode) {
      setFlipPair({ back: backNode, front: frontNode });
    }
    setIsFront(false);
    setIsDetailMode(false);
  }, [backNode, currentCard, frontNode]);

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

  const handleShuffleDone = useCallback(() => {
    shuffleDeck();
    shuffleAnimRef.current?.stop();
    fanCollapse.setValue(0);
    shuffleShake.setValue(0);
    shuffleSwirl.setValue(0);
    setIsShuffling(false);
  }, [fanCollapse, shuffleDeck, shuffleShake, shuffleSwirl]);

  const startShuffle = useCallback(() => {
    setIsShuffling(true);
    fanCollapse.setValue(0);
    shuffleShake.setValue(0);
    shuffleSwirl.setValue(0);

    const stepDuration =
      SHUFFLE_TIMING.SHAKE_DURATION / (SHUFFLE_SHAKE_STEPS * 2);
    const shakeSteps = Array.from({ length: SHUFFLE_SHAKE_STEPS }).flatMap(
      () => [
        Animated.timing(shuffleShake, {
          toValue: 1,
          duration: stepDuration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shuffleShake, {
          toValue: 0,
          duration: stepDuration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ],
    );

    const animation = Animated.sequence([
      Animated.timing(fanCollapse, {
        toValue: 1,
        duration: SHUFFLE_TIMING.COLLAPSE_DURATION,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.delay(SHUFFLE_TIMING.HOLD_BEFORE_SHAKE),
      Animated.sequence(shakeSteps),
      Animated.delay(SHUFFLE_TIMING.HOLD_AFTER_SHAKE),
      Animated.timing(shuffleSwirl, {
        toValue: 1,
        duration: SHUFFLE_TIMING.SWIRL_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(shuffleSwirl, {
        toValue: 0,
        duration: SHUFFLE_TIMING.SWIRL_RESET_DURATION,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(shuffleSwirl, {
        toValue: 1,
        duration: SHUFFLE_TIMING.SWIRL_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(shuffleSwirl, {
        toValue: 0,
        duration: SHUFFLE_TIMING.SWIRL_RESET_DURATION,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(fanCollapse, {
        toValue: 0,
        duration: SHUFFLE_TIMING.EXPAND_DURATION,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    ]);
    shuffleAnimRef.current = animation;
    animation.start(({ finished }) => {
      if (finished) {
        handleShuffleDone();
      }
    });
  }, [fanCollapse, handleShuffleDone, shuffleShake, shuffleSwirl]);

  const handleShufflePress = useCallback(() => {
    if (isShuffling) {
      return;
    }
    if (detailFlipTimeoutRef.current) {
      clearTimeout(detailFlipTimeoutRef.current);
      detailFlipTimeoutRef.current = null;
    }
    if (detailContentSwapTimeoutRef.current) {
      clearTimeout(detailContentSwapTimeoutRef.current);
      detailContentSwapTimeoutRef.current = null;
    }
    setCurrentCard(null);
    setFlipPair(null);
    setIsFront(false);
    setIsDetailMode(false);
    startShuffle();
  }, [isShuffling, startShuffle]);

  const handleCardTap = useCallback(() => {
    if (!currentCard || !flipPair) {
      return;
    }

    const hasDetail = Boolean(currentCard.detailImage);
    if (
      hasDetail &&
      !isDetailMode &&
      isFront &&
      frontNode &&
      detailBgNode &&
      detailFullNode
    ) {
      if (detailFlipTimeoutRef.current) {
        clearTimeout(detailFlipTimeoutRef.current);
        detailFlipTimeoutRef.current = null;
      }
      if (detailContentSwapTimeoutRef.current) {
        clearTimeout(detailContentSwapTimeoutRef.current);
        detailContentSwapTimeoutRef.current = null;
      }
      const detailFlipFront =
        Platform.OS === "ios" ? detailBgNode : detailFullNode;
      setIsFront(false);
      setFlipPair({ back: frontNode, front: detailFlipFront });
      setIsDetailMode(true);
      if (Platform.OS === "web") {
        detailFlipTimeoutRef.current = setTimeout(() => {
          setIsFront(true);
          detailFlipTimeoutRef.current = null;
        }, 0);
        return;
      }
      const scheduleFlipToDetail = () => {
        InteractionManager.runAfterInteractions(() => {
          detailFlipTimeoutRef.current = setTimeout(() => {
            setIsFront(true);
            detailFlipTimeoutRef.current = null;
          }, 50);
        });
      };
      scheduleFlipToDetail();
      if (Platform.OS !== "ios") {
        const cardIdAtSchedule = currentCard.id;
        detailContentSwapTimeoutRef.current = setTimeout(() => {
          if (currentCardIdRef.current !== cardIdAtSchedule) {
            return;
          }
          if (!isDetailModeRef.current) {
            return;
          }
          setFlipPair({ back: frontNode, front: detailFullNode });
          detailContentSwapTimeoutRef.current = null;
        }, 420);
      }
      return;
    }

    if (hasDetail && isDetailMode) {
      setIsFront((prev) => !prev);
      return;
    }

    setIsFront((prev) => !prev);
  }, [
    currentCard,
    detailBgNode,
    detailFullNode,
    flipPair,
    frontNode,
    isDetailMode,
    isFront,
  ]);

  const handleDetailBack = useCallback(() => {
    if (!currentCard || !frontNode) {
      return;
    }
    if (detailFlipTimeoutRef.current) {
      clearTimeout(detailFlipTimeoutRef.current);
      detailFlipTimeoutRef.current = null;
    }
    if (detailContentSwapTimeoutRef.current) {
      clearTimeout(detailContentSwapTimeoutRef.current);
      detailContentSwapTimeoutRef.current = null;
    }
    setIsFront(false);
    setFlipPair({ back: backNode, front: frontNode });
    setIsDetailMode(false);
    const scheduleFlipToFront = () => {
      InteractionManager.runAfterInteractions(() => {
        detailFlipTimeoutRef.current = setTimeout(() => {
          setIsFront(true);
          detailFlipTimeoutRef.current = null;
        }, 50);
      });
    };
    if (Platform.OS === "web") {
      detailFlipTimeoutRef.current = setTimeout(() => {
        setIsFront(true);
        detailFlipTimeoutRef.current = null;
      }, 0);
      return;
    }
    scheduleFlipToFront();
  }, [backNode, currentCard, frontNode]);

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
    [drawNextCard, selectionAnim],
  );

  const handleSelectFromFan = useCallback(
    (slotIndex: number) => {
      if (isShuffling) {
        return;
      }
      if (isConfirmOpen && selectedSlot === slotIndex) {
        handleConfirmSelection(true);
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
    [
      handleConfirmSelection,
      isConfirmOpen,
      isShuffling,
      selectionAnim,
      selectedSlot,
    ],
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
    [history],
  );
  const cardWidth = useMemo(() => {
    const baseWidth = layoutWidth ?? windowWidth;
    const available = baseWidth - spacing.lg * 2;
    const raw = Math.min(available, 340);
    return Platform.OS === "ios" ? PixelRatio.roundToNearestPixel(raw) : raw;
  }, [layoutWidth, windowWidth]);
  const fanCardWidth = useMemo(
    () => Math.min(cardWidth * 0.55, 160),
    [cardWidth],
  );
  const fanCardHeight = useMemo(() => fanCardWidth * 1.5, [fanCardWidth]);
  // Align fan visual center with the fan container center.
  const fanBaseY = useMemo(() => spacing.lg * 1.125 - 50, []);
  const [fanOffsetY, setFanOffsetY] = useState(88);
  const fanHeight = useMemo(() => {
    const contentHeight = fanBaseY + fanOffsetY + fanCardHeight + spacing.sm;
    return Math.max(fanCardHeight + spacing.lg, contentHeight);
  }, [fanBaseY, fanCardHeight, fanOffsetY]);
  const fanAreaCenterX = useMemo(() => {
    const contentWidth = (layoutWidth ?? windowWidth) - spacing.lg * 2;
    const baseWidth = fanSize?.w ?? contentWidth;
    return baseWidth / 2;
  }, [fanSize?.w, layoutWidth, windowWidth]);
  const fanSlots = useMemo(
    () =>
      getFanSlots({
        cardWidth: fanCardWidth,
        baseY: fanBaseY + fanOffsetY,
      }),
    [fanBaseY, fanCardWidth, fanOffsetY],
  );
  const fanMinCardY = useMemo(
    () => Math.min(...fanSlots.map((slot) => slot.y)),
    [fanSlots],
  );
  const swirlRadius = useMemo(
    () => Math.min(fanCardWidth * 0.28, 70),
    [fanCardWidth],
  );
  const swirlPhase = useMemo(
    () =>
      shuffleSwirl.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 1, 0],
      }),
    [shuffleSwirl],
  );
  const swirlStepInput = useMemo(
    () =>
      Array.from({ length: SHUFFLE_SWIRL_STEPS + 1 }).map(
        (_, step) => step / SHUFFLE_SWIRL_STEPS,
      ),
    [],
  );
  const swirlIndices = useMemo(
    () => [fanSlots.length - 1, fanSlots.length - 2, fanSlots.length - 3],
    [fanSlots.length],
  );
  const controlsOffset = useMemo(
    () => Math.min(windowHeight * 0.25, 180),
    [windowHeight],
  );
  const controlsGapScale = 0.5;
  const fanToControlsGap = useMemo(() => 50, []);
  const cardToControlsGap = useMemo(() => 10, []);
  const bannerToFanGapOffset = useMemo(() => -17, []);

  useEffect(() => {
    tapHintAnim.stopAnimation();
    tapHintAnim.setValue(0);
    const anim = Animated.loop(
      Animated.sequence(
        isConfirmOpen
          ? [
              Animated.timing(tapHintAnim, {
                toValue: 1,
                duration: 260,
                easing: Easing.out(Easing.back(1.4)),
                useNativeDriver: true,
              }),
              Animated.timing(tapHintAnim, {
                toValue: 0,
                duration: 420,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
            ]
          : [
              Animated.timing(tapHintAnim, {
                toValue: 1,
                duration: 900,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.timing(tapHintAnim, {
                toValue: 0,
                duration: 900,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
              }),
            ],
      ),
    );
    anim.start();
    return () => anim.stop();
  }, [isConfirmOpen, tapHintAnim]);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(readMoreAnim, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.back(1.6)),
          useNativeDriver: true,
        }),
        Animated.timing(readMoreAnim, {
          toValue: 0,
          duration: 520,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [readMoreAnim]);

  useEffect(() => {
    if (currentCard) {
      return;
    }
    if (!bannerLayout || !fanLayout) {
      return;
    }
    const bannerBottom = bannerLayout.y + bannerLayout.height;
    const fanTop = fanLayout.y + fanMinCardY;
    const currentGap = fanTop - bannerBottom;
    const targetGap = fanToControlsGap + bannerToFanGapOffset;
    const delta = targetGap - currentGap;
    if (Math.abs(delta) < 1) {
      return;
    }
    setFanOffsetY((prev) => prev + delta);
  }, [
    bannerLayout,
    currentCard,
    fanLayout,
    fanMinCardY,
    fanToControlsGap,
    bannerToFanGapOffset,
  ]);

  const selectedCard = selectedHistoryId
    ? (cardsById.get(selectedHistoryId) ?? null)
    : null;
  const selectedEntry = selectedHistoryId
    ? (history.find((entry) => entry.id === selectedHistoryId) ?? null)
    : null;
  const selectedJournalCard = selectedJournalId
    ? (cardsById.get(selectedJournalId) ?? null)
    : null;
  const journalDetailText = useMemo(() => {
    if (!selectedJournalCard) {
      return "No description available.";
    }
    const lines = buildDetailLines(selectedJournalCard).slice(1);
    if (lines.length === 0) {
      return "No description available.";
    }
    return lines
      .map((line) => {
        if (line.type === "heading") {
          return line.text;
        }
        if (line.type === "bullet") {
          return `• ${line.text.replace(/^~/, "")}`;
        }
        return line.text;
      })
      .join("\n\n");
  }, [selectedJournalCard]);
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
    [setSelectedHistoryId],
  );
  const renderJournalEntry = useCallback(
    ({ item }: { item: { id: string; title: string; entry: string } }) => {
      const card = cardsById.get(item.id) ?? null;
      return (
        <Pressable
          style={styles.journalEntry}
          onPress={() => {
            setSelectedJournalId(item.id);
            setIsJournalEntriesOpen(false);
          }}
          accessibilityLabel={`Open journal entry for ${item.title}`}
        >
          <View style={styles.journalEntryThumb}>
            {card ? (
              <Image source={card.image} style={styles.journalEntryThumbImage} />
            ) : (
              <View style={styles.thumbnailFallback} />
            )}
          </View>
          <View style={styles.journalEntryContent}>
            <Text style={styles.journalEntryTitle}>{item.title}</Text>
            <Text style={styles.journalEntryBody} numberOfLines={2}>
              {item.entry}
            </Text>
          </View>
        </Pressable>
      );
    },
    [],
  );

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.root}>
      <ImageBackground
        source={bg}
        style={[
          styles.bg,
          {
            top: -insets.top,
            bottom: -insets.bottom,
            left: -insets.left,
            right: -insets.right,
          },
        ]}
        imageStyle={styles.bgImg}
        resizeMode="cover"
      />
      <View
        pointerEvents="none"
        style={[
          styles.bgTint,
          {
            top: -insets.top,
            bottom: -insets.bottom,
            left: -insets.left,
            right: -insets.right,
          },
        ]}
      />
      <ScrollView
        style={styles.screen}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        scrollIndicatorInsets={{ top: 0, left: 0, right: 0, bottom: 0 }}
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: spacing.lg + insets.top,
            paddingBottom: spacing.lg + insets.bottom,
          },
        ]}
      >
        <View
          style={styles.centerWrap}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            if (!width) {
              return;
            }
            if (lastLayoutWidthRef.current !== width) {
              lastLayoutWidthRef.current = width;
              setLayoutWidth(width);
            }
          }}
        >
          <View style={styles.column}>
            <Image
              source={require("../assets/banner.png")}
              style={styles.banner}
              resizeMode="contain"
              onLayout={(event) => {
                const { y, height } = event.nativeEvent.layout;
                setBannerLayout({ y, height });
              }}
            />
            {!currentCard ? (
              <Animated.Text
                style={[
                  styles.tapHint,
                  {
                    opacity: tapHintAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.55, 1],
                    }),
                    transform: isConfirmOpen
                      ? [
                          {
                            translateY: tapHintAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -10],
                            }),
                          },
                          {
                            translateX: tapHintAnim.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [0, 4, 0],
                            }),
                          },
                          {
                            rotate: tapHintAnim.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: ["0deg", "-4deg", "0deg"],
                            }),
                          },
                          {
                            scale: tapHintAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.08],
                            }),
                          },
                        ]
                      : [
                          {
                            translateY: tapHintAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -6],
                            }),
                          },
                          {
                            scale: tapHintAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.04],
                            }),
                          },
                        ],
                  },
                ]}
              >
                {isConfirmOpen ? "Tap again to confirm" : "Tap a card"}
              </Animated.Text>
            ) : null}
            {currentCard ? (
              <View style={[styles.cardWrapper, { width: cardWidth }]}>
                <CardFlip
                  key={`${currentCard.id}:${isDetailMode ? "detail" : "front"}:${flipPair?.front ? "hasFront" : "noFront"}`}
                  onBeforeFlip={handleCardTap}
                  isFront={isFront}
                  front={flipPair?.front ?? frontNode}
                  back={flipPair?.back ?? backNode}
                  disabled={false}
                  style={[
                    styles.cardArea,
                    {
                      width: cardWidth,
                      aspectRatio: 2 / 3,
                    },
                  ]}
                />
                {!isDetailMode ? (
                  <Animated.Text
                    style={[
                      styles.readMoreHint,
                      {
                        opacity: readMoreAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.75, 1],
                        }),
                        transform: [
                          {
                            scale: readMoreAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.98, 1.07],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    Tap to read more
                  </Animated.Text>
                ) : null}
                {isDetailMode ? (
                  <View style={styles.cardActions}>
                    <ThemedButton
                      label="Reset"
                      onPress={resetApp}
                      variant="ghost"
                      style={styles.cardActionButton}
                      labelStyle={styles.cardActionLabel}
                    />
                    <ThemedButton
                      label="Journal"
                      onPress={openJournal}
                      variant="secondary"
                      style={styles.cardActionButton}
                      labelStyle={styles.cardActionLabel}
                    />
                  </View>
                ) : null}
                {Platform.OS === "ios" && isDetailMode && isFront ? (
                  <View
                    pointerEvents="box-none"
                    style={styles.detailOverlayFloat}
                  >
                    {detailOverlayNode}
                  </View>
                ) : null}
                {currentCard.detailImage && !isDetailMode && isFront
                  ? null
                  : null}
              </View>
            ) : (
              <>
                <View
                  onLayout={(event) => {
                    const { width, height, y } = event.nativeEvent.layout;
                    setFanSize({ w: width, h: height });
                    setFanLayout({ y, height });
                  }}
                  pointerEvents={isShuffling ? "none" : "auto"}
                  style={[
                    styles.fanArea,
                    {
                      width: "100%",
                      height: fanHeight,
                    },
                  ]}
                >
                  {fanSlots.map((slot, index) => {
                    const centerOffset = index - 3.5;
                    const stackX = centerOffset * 0.6 - fanCardWidth / 2;
                    const stackY =
                      fanBaseY + fanOffsetY + (index % 2 === 0 ? -0.4 : 0.4);
                    const stackRot = centerOffset * 0.6;
                    const depthScale = index % 2 === 0 ? -0.008 : 0.01;
                    const isSwirl = swirlIndices.includes(index);
                    const isSelected = selectedSlot === index;
                    const pullOutY = Animated.multiply(
                      selectionAnim,
                      fanCardHeight * 0.18,
                    );
                    const translateX = fanCollapse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [slot.x - fanCardWidth / 2, stackX],
                    });
                    const translateY = fanCollapse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [slot.y, stackY],
                    });
                    const rotateZ = fanCollapse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [`${slot.rot}deg`, `${stackRot}deg`],
                    });
                    const scale = Animated.add(
                      1,
                      Animated.multiply(fanCollapse, depthScale),
                    );
                    const shakeX = Animated.multiply(
                      fanCollapse,
                      shuffleShake.interpolate({
                        inputRange: [0, 0.25, 0.5, 0.75, 1],
                        outputRange: [0, -3, 3, -2, 0],
                      }),
                    );
                    const shakeY = Animated.multiply(
                      fanCollapse,
                      shuffleShake.interpolate({
                        inputRange: [0, 0.25, 0.5, 0.75, 1],
                        outputRange: [0, 2, -2, 1, 0],
                      }),
                    );
                    const phaseOffset =
                      swirlIndices.indexOf(index) * ((Math.PI * 2) / 3);
                    const swirlXBase = isSwirl
                      ? shuffleSwirl.interpolate({
                          inputRange: swirlStepInput,
                          outputRange: swirlStepInput.map(
                            (step) =>
                              Math.cos(step * Math.PI * 2 + phaseOffset) *
                              swirlRadius,
                          ),
                        })
                      : Animated.multiply(shuffleSwirl, 0);
                    const swirlYBase = isSwirl
                      ? shuffleSwirl.interpolate({
                          inputRange: swirlStepInput,
                          outputRange: swirlStepInput.map(
                            (step) =>
                              Math.sin(step * Math.PI * 2 + phaseOffset) *
                              swirlRadius *
                              0.65,
                          ),
                        })
                      : Animated.multiply(shuffleSwirl, 0);
                    const swirlX = Animated.multiply(swirlPhase, swirlXBase);
                    const swirlY = Animated.multiply(swirlPhase, swirlYBase);
                    const swirlRotate = isSwirl
                      ? shuffleSwirl.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: ["0deg", "6deg", "0deg"],
                        })
                      : "0deg";
                    return (
                      <AnimatedPressable
                        key={`fan-card-${index}`}
                        onPress={() => handleSelectFromFan(index)}
                        accessibilityRole="button"
                        accessibilityLabel={`Pick card ${index + 1}`}
                        style={[
                          styles.fanCard,
                          {
                            width: fanCardWidth,
                            height: fanCardHeight,
                            left: fanAreaCenterX,
                            zIndex: index,
                            transform: [
                              {
                                translateX: Animated.add(
                                  translateX,
                                  Animated.add(shakeX, swirlX),
                                ),
                              },
                              {
                                translateY: Animated.add(
                                  translateY,
                                  Animated.add(shakeY, swirlY),
                                ),
                              },
                              { rotate: rotateZ },
                              { rotate: swirlRotate },
                              { scale },
                              ...(isSelected ? [{ translateY: pullOutY }] : []),
                            ],
                          },
                        ]}
                      >
                        <Image
                          source={cardBackImage}
                          style={styles.fanCardImage}
                        />
                        {isSelected && isConfirmOpen ? null : null}
                      </AnimatedPressable>
                    );
                  })}
                </View>
              </>
            )}
            <View
              style={{
                height: currentCard ? cardToControlsGap : fanToControlsGap,
              }}
            />

            <View
              style={[
                styles.controls,
                { width: cardWidth },
                { marginTop: currentCard ? 0 : 40 },
              ]}
            >
              {!currentCard && !isConfirmOpen ? (
                <>
                  <Pressable
                    onPress={handleShufflePress}
                    disabled={isShuffling}
                    accessibilityRole="button"
                    accessibilityLabel="Shuffle"
                    style={({ pressed }) => [
                      styles.shuffleButton,
                      pressed && !isShuffling && styles.shuffleButtonPressed,
                    ]}
                  >
                    <Image
                      source={shuffleImage}
                      style={styles.shuffleButtonImage}
                      resizeMode="contain"
                    />
                  </Pressable>
                  <ThemedButton
                    label="Journal Entries"
                    onPress={() => setIsJournalEntriesOpen(true)}
                    variant="secondary"
                    style={styles.journalEntriesButton}
                    labelStyle={styles.journalEntriesLabel}
                  />
                </>
              ) : null}
            </View>

            <Modal transparent visible={isHistoryOpen} animationType="fade">
              <View style={styles.modalOverlay}>
                <View style={[styles.modalCard, styles.journalCard]}>
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
              visible={isJournalEntriesOpen}
              animationType="fade"
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Journal Entries</Text>
                    <ThemedButton
                      label="Close"
                      onPress={() => setIsJournalEntriesOpen(false)}
                      variant="ghost"
                      style={styles.modalCloseButton}
                    />
                  </View>
                  {journalEntryList.length === 0 ? (
                    <Text style={styles.modalEmpty}>
                      No journal entries yet.
                    </Text>
                  ) : (
                    <FlatList
                      data={journalEntryList}
                      renderItem={renderJournalEntry}
                      keyExtractor={(item) => item.id}
                      showsVerticalScrollIndicator={false}
                      style={styles.modalList}
                      contentContainerStyle={styles.journalList}
                    />
                  )}
                </View>
              </View>
            </Modal>

            <Modal
              transparent
              visible={selectedJournalId !== null}
              animationType="fade"
            >
              <View style={styles.journalOverlay}>
                <View style={[styles.modalCard, styles.journalCard]}>
                  {selectedJournalId ? (
                    <ScrollView contentContainerStyle={styles.detailContent}>
                      <Text style={styles.journalDetailTitle}>
                        {selectedJournalCard?.title ?? "Card"}
                      </Text>
                      <View style={styles.journalFlipWrap}>
                        <CardFlip
                          isFront={isJournalCardFront}
                          onBeforeFlip={() =>
                            setIsJournalCardFront((prev) => !prev)
                          }
                          idle={false}
                          front={
                            selectedJournalCard?.image ? (
                              <Image
                                source={selectedJournalCard.image}
                                style={styles.cardImage}
                              />
                            ) : (
                              <View style={styles.thumbnailFallback} />
                            )
                          }
                          back={
                            <ImageBackground
                              source={
                                selectedJournalCard?.detailImage ??
                                selectedJournalCard?.image ??
                                cardBackImage
                              }
                              style={styles.journalDetailBack}
                              imageStyle={styles.cardImage}
                            >
                              <View style={styles.journalDetailBackOverlay}>
                                <Text style={styles.journalDetailBackTitle}>
                                  {selectedJournalCard?.title ?? "Card"}
                                </Text>
                                <ScrollView
                                  contentContainerStyle={
                                    styles.journalDetailBackScroll
                                  }
                                  showsVerticalScrollIndicator={false}
                                >
                                  <Text style={styles.journalDetailBackText}>
                                    {journalDetailText}
                                  </Text>
                                </ScrollView>
                              </View>
                            </ImageBackground>
                          }
                          style={styles.journalFlipCard}
                        />
                      </View>
                      <View style={styles.journalReflectionWrap}>
                        <Text style={styles.journalReflectionTitle}>
                          Your Reflection
                        </Text>
                        <ScrollView
                          contentContainerStyle={styles.journalReflectionScroll}
                          style={styles.journalReflectionScrollArea}
                          showsVerticalScrollIndicator={false}
                        >
                          <Text style={styles.journalEntryDetailBody}>
                            {journalEntries[selectedJournalId] ?? ""}
                          </Text>
                        </ScrollView>
                      </View>
                    </ScrollView>
                  ) : null}
                  <ThemedButton
                    label="Close"
                    onPress={() => {
                      setSelectedJournalId(null);
                      setIsJournalEntriesOpen(true);
                    }}
                    variant="secondary"
                    style={styles.journalCloseButton}
                    labelStyle={styles.journalCloseLabel}
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
                      <Text style={styles.modalTitle}>
                        {selectedCard.title}
                      </Text>
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
                    <Text style={styles.modalEmpty}>
                      Card image not available.
                    </Text>
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

            <Modal transparent visible={isJournalOpen} animationType="fade">
              <View style={styles.modalOverlay}>
                <View style={[styles.modalCard, styles.journalCard]}>
                  <Text style={styles.journalTitle}>Journal</Text>
                  <Text style={[styles.modalSubtitle, styles.journalSubtitle]}>
                    {currentCard?.title ?? "Card"}
                  </Text>
                  <TextInput
                    value={journalDraft}
                    onChangeText={setJournalDraft}
                    placeholder="Write your thoughts..."
                    placeholderTextColor="rgba(17, 16, 15, 0.45)"
                    multiline
                    textAlignVertical="top"
                    style={styles.journalInput}
                  />
                  <View style={styles.journalActions}>
                    <ThemedButton
                      label="Save and Close"
                      onPress={saveJournal}
                      variant="secondary"
                      style={styles.cardActionButton}
                      labelStyle={styles.cardActionLabel}
                    />
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    ...StyleSheet.absoluteFillObject,
  },
  bgImg: {
    width: "100%",
    height: "100%",
  },
  bgTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(18,16,36,0.18)",
  },
  root: {
    flex: 1,
    width: "100%",
  },
  screen: {
    backgroundColor: "transparent",
  },
  container: {
    flexGrow: 1,
    minWidth: "100%",
    paddingVertical: spacing.lg,
    backgroundColor: "transparent",
  },
  centerWrap: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  column: {
    width: "100%",
    alignSelf: "center",
    alignItems: "center",
  },
  title: {
    color: colors.accentLavender,
    fontSize: typography.title,
    fontWeight: "800",
    fontFamily: appFontFamily,
    marginTop: spacing.xs,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  banner: {
    width: "100%",
    maxWidth: 640,
    height: 140,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.muted,
    marginTop: 0,
    marginBottom: spacing.xs,
    textAlign: "center",
    fontSize: typography.subtitle,
    fontFamily: appFontFamily,
  },
  tapHint: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    fontSize: Math.round((typography.subtitle + 2) * 1.3),
    fontFamily: appFontFamily,
    fontWeight: "800",
    color: colors.surface,
    textAlign: "center",
    letterSpacing: 0.6,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cardWrapper: {
    position: "relative",
    alignItems: "center",
  },
  cardActions: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  cardActionButton: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: "#f2c8a7",
    borderColor: "#d4a47d",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardActionLabel: {
    color: "#11110f",
    letterSpacing: 0.3,
    fontSize: 18,
  },
  readMoreHint: {
    marginTop: spacing.sm + 5,
    fontSize: Math.round(typography.subtitle * 3),
    fontFamily: appFontFamily,
    color: "#b57a6b",
    textAlign: "center",
    letterSpacing: 0.4,
    textShadowColor: "rgba(0,0,0,0.99)",
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 12,
    fontWeight: "800",
  },
  cardArea: {
    marginBottom: 0,
  },
  detailOverlay: {
    position: "absolute",
    flexDirection: "column",
    top: 46,
    right: 32,
    bottom: 44,
    left: 32,
  },
  detailOverlayFloat: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  detailScroll: {
    flex: 1,
  },
  detailScrollContent: {
    padding: spacing.sm,
    paddingBottom: 32,
    backgroundColor: "transparent",
  },
  detailHeader: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.12)",
  },
  detailBackButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.2)",
  },
  detailBackButtonText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: appFontFamily,
  },
  detailTitleText: {
    fontFamily: detailFontFamilyBold,
    color: "#000",
    fontSize: Math.round(22 * 1.3),
    fontStyle: "italic",
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  detailBodyText: {
    fontFamily: detailFontFamily,
    color: "#000",
    fontSize: Math.round(16 * 1.3),
    lineHeight: Math.round(23 * 1.3),
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  detailHeadingText: {
    fontFamily: detailFontFamilyBold,
    color: "#000",
    fontSize: Math.round(17 * 1.3),
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  detailBulletText: {
    fontFamily: detailFontFamily,
    color: "#000",
    fontSize: Math.round(16 * 1.3),
    lineHeight: Math.round(23 * 1.3),
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  fanArea: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
    marginTop: 0,
  },
  fanCard: {
    position: "absolute",
    left: 0,
    borderRadius: radii.lg,
    overflow: "hidden",
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
    backgroundColor: "transparent",
    borderRadius: 0,
    borderWidth: 0,
    borderColor: "transparent",
  },
  shuffleButton: {
    alignSelf: "center",
    width: Math.round(180 * 1.75),
    height: Math.round(66 * 1.75),
    marginTop: -50,
    alignItems: "center",
    justifyContent: "center",
  },
  shuffleButtonImage: {
    width: "100%",
    height: "100%",
  },
  shuffleButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  journalEntriesButton: {
    alignSelf: "center",
    marginTop: spacing.sm,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.xl,
  },
  journalEntriesLabel: {
    fontSize: 15,
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(18, 16, 36, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  journalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
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
  journalCard: {
    backgroundColor: "#C08B8A",
    borderColor: "rgba(66, 34, 36, 0.35)",
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
    fontFamily: appFontFamily,
  },
  journalDetailTitle: {
    color: "#2A1517",
    fontWeight: "700",
    fontSize: 18,
    fontFamily: appFontFamily,
  },
  journalTitle: {
    color: "#2A1517",
    fontWeight: "700",
    fontSize: 20,
    fontFamily: appFontFamily,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    color: colors.textSoft,
    textAlign: "center",
    marginBottom: spacing.md,
    fontFamily: appFontFamily,
  },
  journalSubtitle: {
    color: "rgba(42, 21, 23, 0.75)",
    fontSize: 42,
    fontWeight: "700",
  },
  modalList: {
    maxHeight: 320,
  },
  journalList: {
    paddingBottom: spacing.sm,
  },
  journalEntry: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceAlt,
    marginBottom: spacing.sm,
  },
  journalEntryThumb: {
    width: 52,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: "hidden",
    backgroundColor: colors.surfaceAlt,
  },
  journalEntryThumbImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  journalEntryContent: {
    flex: 1,
  },
  journalEntryTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 16,
    marginBottom: spacing.xs,
    fontFamily: appFontFamily,
  },
  journalEntryBody: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: appFontFamily,
  },
  journalFlipWrap: {
    width: "100%",
    alignItems: "center",
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  journalFlipCard: {
    width: 260,
    height: 390,
  },
  journalDetailBack: {
    flex: 1,
  },
  journalDetailBackOverlay: {
    flex: 1,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    justifyContent: "flex-start",
    backgroundColor: "transparent",
  },
  journalDetailBackTitle: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: spacing.sm,
    fontFamily: appFontFamily,
  },
  journalDetailBackScroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    maxHeight: 220,
  },
  journalDetailBackText: {
    color: "#000",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: appFontFamily,
    textAlign: "center",
  },
  journalEntryDetailBody: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: appFontFamily,
    textAlign: "center",
  },
  journalReflectionWrap: {
    width: "100%",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  journalReflectionScrollArea: {
    maxHeight: 160,
    width: "100%",
  },
  journalReflectionScroll: {
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  journalReflectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: spacing.xs,
    fontFamily: appFontFamily,
    textAlign: "center",
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
    fontFamily: appFontFamily,
  },
  historyDate: {
    color: colors.textSoft,
    fontSize: 10,
    fontFamily: appFontFamily,
  },
  modalEmpty: {
    color: colors.textSoft,
    textAlign: "center",
    paddingVertical: spacing.md,
    fontFamily: appFontFamily,
  },
  thumbnailFallback: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
  },
  modalCloseButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  journalCloseButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: "center",
    backgroundColor: "#C08B8A",
    borderColor: "rgba(66, 34, 36, 0.35)",
  },
  journalCloseLabel: {
    color: "#2A1517",
  },
  journalInput: {
    minHeight: 140,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.sm,
    color: "rgba(42, 21, 23, 0.75)",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    fontFamily: appFontFamily,
    fontSize: 16,
    textAlign: "center",
  },
  journalActions: {
    marginTop: spacing.sm,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
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
