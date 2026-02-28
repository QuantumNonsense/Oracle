import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useFonts } from "expo-font";
import { Audio, type AVPlaybackStatus } from "expo-av";
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  ImageBackground,
  InteractionManager,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
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
const SHUFFLE_START_PROGRESS_ON_OPEN = 0.4;
const SHUFFLE_TOTAL_DURATION =
  SHUFFLE_TIMING.COLLAPSE_DURATION +
  SHUFFLE_TIMING.HOLD_BEFORE_SHAKE +
  SHUFFLE_TIMING.SHAKE_DURATION +
  SHUFFLE_TIMING.HOLD_AFTER_SHAKE +
  SHUFFLE_TIMING.SWIRL_DURATION +
  SHUFFLE_TIMING.SWIRL_RESET_DURATION +
  SHUFFLE_TIMING.SWIRL_DURATION +
  SHUFFLE_TIMING.SWIRL_RESET_DURATION +
  SHUFFLE_TIMING.EXPAND_DURATION;
const CARD_FLIP_DURATION_MS = 380;
const IOS_DETAIL_OVERLAY_HOLD_MS = 180;
const DETAIL_TEXT_BLANK_MS = 200;
const DETAIL_TEXT_LINE_REVEAL_MS = 1400;
const DETAIL_TEXT_LINE_STAGGER_MS = 220;

const FAVORITES_KEY = "oracle:favorites";
const LAST_CARD_KEY = "oracle:last-card";
const HISTORY_KEY = "oracle:history:v1";
const JOURNAL_KEY = "oracle:journals:v1";
const AUDIO_ENABLED_KEY = "oracle:audio-enabled:v1";
const MUSIC_TRACKS = [
  require("../assets/Music/Mosslight.Whispers.mp3"),
  require("../assets/Music/Mosslight.Whispers.2.mp3"),
];

type HistoryEntry = {
  id: string;
  title: string;
  drawnAt: string;
};

type JournalEntry = {
  id: string;
  cardId: string;
  entry: string;
  createdAt: string;
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

type DrawMode = "single" | "triple";

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
  ios: "MilongaRegular",
  android: "MilongaRegular",
  default: "'MilongaRegular', 'Times New Roman', serif",
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

const createJournalEntryId = () =>
  `journal-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

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

const parseStoredJournals = (raw: string): JournalEntry[] => {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is JournalEntry =>
          Boolean(
            item &&
            typeof item === "object" &&
            typeof (item as JournalEntry).id === "string" &&
            typeof (item as JournalEntry).cardId === "string" &&
            typeof (item as JournalEntry).entry === "string" &&
            typeof (item as JournalEntry).createdAt === "string",
          ),
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }

    if (parsed && typeof parsed === "object") {
      // Backward compatibility for v1 shape: Record<cardId, entry>.
      return Object.entries(parsed as Record<string, string>)
        .filter(([, entry]) => typeof entry === "string" && entry.trim().length)
        .map(([cardId, entry], index) => ({
          id: `legacy-${cardId}-${index}`,
          cardId,
          entry: entry.trim(),
          createdAt: new Date(0).toISOString(),
        }))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }
  } catch (error) {
    return [];
  }
  return [];
};

export default function Index() {
  const [fontsLoaded] = useFonts({
    MilongaRegular: require("../assets/Milonga-Regular.ttf"),
  });
  const bg = require("../assets/backgrounds/mushroom-field.png");
  const shuffleImage = require("../assets/Shuffle.png");
  const scrollImage = require("../assets/Scroll.png");
  const musicToggleIcon = require("../assets/music.png");
  const journalToggleIcon = require("../assets/journal.png");
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const journalComposeWidth = Math.min(
    windowWidth - insets.left - insets.right - 2,
    560,
  );
  const journalContentWidth = Math.min(journalComposeWidth * 0.76, 332);
  const journalComposeOffsetX = Platform.OS === "ios" ? 20 : 0;
  const journalDetailWidth = journalComposeWidth;
  const journalDetailContentWidth = Math.min(journalDetailWidth * 0.76, 332);
  const journalDetailOffsetX = journalComposeOffsetX;
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
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [journalDraft, setJournalDraft] = useState("");
  const [isJournalEntriesOpen, setIsJournalEntriesOpen] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [selectedJournalEntryId, setSelectedJournalEntryId] = useState<
    string | null
  >(null);
  const [isJournalCardFront, setIsJournalCardFront] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(
    null,
  );
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleStartRequest, setShuffleStartRequest] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [drawMode, setDrawMode] = useState<DrawMode>("single");
  const [tripleCards, setTripleCards] = useState<Card[]>([]);
  const [activeTripleCardIndex, setActiveTripleCardIndex] = useState(0);
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
  const iosDetailOverlayHoldTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const cardInteractionLockTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const isCardTransitioningRef = useRef(false);
  const isDetailModeRef = useRef(false);
  const currentCardIdRef = useRef<string | null>(null);
  const isAudioEnabledRef = useRef(true);
  const activeTrackIndexRef = useRef(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const audioLoadVersionRef = useRef(0);
  const [isCardInteractionLocked, setIsCardInteractionLocked] = useState(false);
  const [isIosDetailOverlayHeld, setIsIosDetailOverlayHeld] = useState(false);
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
  const journalEntryList = useMemo(() => journalEntries, [journalEntries]);
  const detailLines = useMemo(
    () => buildDetailLines(currentCard),
    [currentCard],
  );

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
    isAudioEnabledRef.current = isAudioEnabled;
  }, [isAudioEnabled]);

  const unloadCurrentSound = useCallback(async () => {
    const activeSound = soundRef.current;
    soundRef.current = null;
    if (!activeSound) {
      return;
    }
    activeSound.setOnPlaybackStatusUpdate(null);
    try {
      await activeSound.unloadAsync();
    } catch (error) {
      // Ignore unload errors from already-released audio instances.
    }
  }, []);

  const playTrackAtIndex = useCallback(
    async (index: number) => {
      if (!isAudioEnabledRef.current) {
        return;
      }
      const loadVersion = ++audioLoadVersionRef.current;
      await unloadCurrentSound();
      try {
        const normalizedIndex =
          ((index % MUSIC_TRACKS.length) + MUSIC_TRACKS.length) %
          MUSIC_TRACKS.length;
        const { sound } = await Audio.Sound.createAsync(
          MUSIC_TRACKS[normalizedIndex],
          {
            shouldPlay: true,
            isLooping: false,
            volume: 1,
          },
        );
        if (loadVersion !== audioLoadVersionRef.current) {
          await sound.unloadAsync();
          return;
        }
        soundRef.current = sound;
        activeTrackIndexRef.current = normalizedIndex;
        sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (
            !status.isLoaded ||
            !status.didJustFinish ||
            !isAudioEnabledRef.current
          ) {
            return;
          }
          void playTrackAtIndex(
            (activeTrackIndexRef.current + 1) % MUSIC_TRACKS.length,
          );
        });
      } catch (error) {
        // Autoplay can be blocked on web until user interaction.
      }
    },
    [unloadCurrentSound],
  );

  useEffect(() => {
    const configureAndStartAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
        });
      } catch (error) {
        // Ignore unsupported platform audio mode errors.
      }
      if (isAudioEnabledRef.current) {
        await playTrackAtIndex(0);
      }
    };
    void configureAndStartAudio();
    return () => {
      audioLoadVersionRef.current += 1;
      void unloadCurrentSound();
    };
  }, [playTrackAtIndex, unloadCurrentSound]);

  useEffect(() => {
    if (isAudioEnabled) {
      if (soundRef.current) {
        void soundRef.current.playAsync();
      } else {
        void playTrackAtIndex(activeTrackIndexRef.current);
      }
      return;
    }
    if (soundRef.current) {
      void soundRef.current.pauseAsync();
    }
  }, [isAudioEnabled, playTrackAtIndex]);

  const toggleAudio = useCallback(() => {
    setIsAudioEnabled((prev) => {
      const next = !prev;
      isAudioEnabledRef.current = next;
      void storage.setItem(AUDIO_ENABLED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const loadState = async () => {
      const [
        storedFavorites,
        storedLast,
        storedHistory,
        storedJournals,
        storedAudioEnabled,
      ] = await Promise.all([
        storage.getItem(FAVORITES_KEY),
        storage.getItem(LAST_CARD_KEY),
        storage.getItem(HISTORY_KEY),
        storage.getItem(JOURNAL_KEY),
        storage.getItem(AUDIO_ENABLED_KEY),
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
        setJournalEntries(parseStoredJournals(storedJournals));
      }

      if (storedAudioEnabled !== null) {
        const nextEnabled = storedAudioEnabled === "true";
        isAudioEnabledRef.current = nextEnabled;
        setIsAudioEnabled(nextEnabled);
      }
    };

    void loadState();
  }, []);

  useEffect(() => {
    setShuffleStartRequest((prev) => prev + 1);
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

  const persistJournals = useCallback((next: JournalEntry[]) => {
    void storage.setItem(JOURNAL_KEY, JSON.stringify(next));
  }, []);

  const openJournal = useCallback(() => {
    if (!currentCard) {
      return;
    }
    setJournalDraft("");
    setIsJournalOpen(true);
  }, [currentCard]);

  const saveJournal = useCallback(() => {
    if (!currentCard) {
      setIsJournalOpen(false);
      return;
    }
    const trimmed = journalDraft.trim();
    if (!trimmed) {
      setIsJournalOpen(false);
      return;
    }
    setJournalEntries((prev) => {
      const next = [
        {
          id: createJournalEntryId(),
          cardId: currentCard.id,
          entry: trimmed,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ];
      persistJournals(next);
      return next;
    });
    setJournalDraft("");
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
    if (iosDetailOverlayHoldTimeoutRef.current) {
      clearTimeout(iosDetailOverlayHoldTimeoutRef.current);
      iosDetailOverlayHoldTimeoutRef.current = null;
    }
    if (cardInteractionLockTimeoutRef.current) {
      clearTimeout(cardInteractionLockTimeoutRef.current);
      cardInteractionLockTimeoutRef.current = null;
    }
    isCardTransitioningRef.current = false;
    setIsCardInteractionLocked(false);
    setIsIosDetailOverlayHeld(false);
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
    setSelectedSlots([]);
    setTripleCards([]);
    setActiveTripleCardIndex(0);
    setIsConfirmOpen(false);
    setAutoFlipNext(false);
    setIsShuffling(false);
    setFanOffsetY(88);
    setIsJournalOpen(false);
    setIsJournalEntriesOpen(false);
    setSelectedJournalEntryId(null);
    setJournalDraft("");
    setShuffleStartRequest((prev) => prev + 1);
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

  const drawTripleCards = useCallback(
    (autoFlip = false) => {
      setAutoFlipNext(autoFlip);
      setDeckState((prev) => {
        let nextState = prev;
        const drawnCards: Card[] = [];
        for (let i = 0; i < 3; i += 1) {
          const result = drawNext(nextState);
          nextState = result.state;
          drawnCards.push(result.card);
        }
        setTripleCards(drawnCards);
        setActiveTripleCardIndex(0);
        setCurrentCard(drawnCards[0] ?? null);
        drawnCards.forEach((card) => {
          recordHistory(card);
        });
        if (drawnCards[0]) {
          persistLastCard(drawnCards[0]);
        }
        return nextState;
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
    if (selectedJournalEntryId) {
      setIsJournalCardFront(true);
    }
  }, [selectedJournalEntryId]);

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
      if (iosDetailOverlayHoldTimeoutRef.current) {
        clearTimeout(iosDetailOverlayHoldTimeoutRef.current);
        iosDetailOverlayHoldTimeoutRef.current = null;
      }
      if (cardInteractionLockTimeoutRef.current) {
        clearTimeout(cardInteractionLockTimeoutRef.current);
        cardInteractionLockTimeoutRef.current = null;
      }
      isCardTransitioningRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "ios") {
      setIsIosDetailOverlayHeld(false);
      return;
    }
    if (iosDetailOverlayHoldTimeoutRef.current) {
      clearTimeout(iosDetailOverlayHoldTimeoutRef.current);
      iosDetailOverlayHoldTimeoutRef.current = null;
    }
    if (!currentCard || !isDetailMode) {
      setIsIosDetailOverlayHeld(false);
      return;
    }
    if (isFront) {
      setIsIosDetailOverlayHeld(true);
      return;
    }
    if (!isIosDetailOverlayHeld) {
      return;
    }
    iosDetailOverlayHoldTimeoutRef.current = setTimeout(() => {
      setIsIosDetailOverlayHeld(false);
      iosDetailOverlayHoldTimeoutRef.current = null;
    }, IOS_DETAIL_OVERLAY_HOLD_MS);
  }, [currentCard, isDetailMode, isFront, isIosDetailOverlayHeld]);

  const clearCardInteractionLock = useCallback(() => {
    if (cardInteractionLockTimeoutRef.current) {
      clearTimeout(cardInteractionLockTimeoutRef.current);
      cardInteractionLockTimeoutRef.current = null;
    }
    isCardTransitioningRef.current = false;
    setIsCardInteractionLocked(false);
  }, []);

  const lockCardInteraction = useCallback((durationMs: number) => {
    if (cardInteractionLockTimeoutRef.current) {
      clearTimeout(cardInteractionLockTimeoutRef.current);
      cardInteractionLockTimeoutRef.current = null;
    }
    isCardTransitioningRef.current = true;
    setIsCardInteractionLocked(true);
    cardInteractionLockTimeoutRef.current = setTimeout(() => {
      isCardTransitioningRef.current = false;
      setIsCardInteractionLocked(false);
      cardInteractionLockTimeoutRef.current = null;
    }, durationMs);
  }, []);

  useEffect(() => {
    clearCardInteractionLock();
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
  }, [backNode, clearCardInteractionLock, currentCard, frontNode]);

  const shuffleDeck = useCallback(() => {
    setDeckState((prev) => ({
      ...prev,
      order: shuffle(prev.cards),
      index: 0,
    }));
    setIsFront(false);
    setCurrentCard(null);
    setSelectedSlot(null);
    setSelectedSlots([]);
    setTripleCards([]);
    setActiveTripleCardIndex(0);
    setIsConfirmOpen(false);
    selectionAnim.setValue(0);
  }, [selectionAnim]);

  const handleShuffleDone = useCallback(() => {
    shuffleDeck();
    shuffleAnimRef.current?.stop();
    fanCollapse.setValue(0);
    shuffleShake.setValue(0);
    shuffleSwirl.setValue(0);
    setIsShuffling(false);
  }, [fanCollapse, shuffleDeck, shuffleShake, shuffleSwirl]);

  const startShuffle = useCallback(
    (initialProgress = 0) => {
      setIsShuffling(true);
      const progress = Math.min(Math.max(initialProgress, 0), 1);
      let elapsed = SHUFFLE_TOTAL_DURATION * progress;
      const consumeElapsed = (duration: number) => {
        const consumed = Math.min(elapsed, duration);
        elapsed -= consumed;
        return consumed;
      };
      const collapseElapsed = consumeElapsed(SHUFFLE_TIMING.COLLAPSE_DURATION);
      const holdBeforeShakeElapsed = consumeElapsed(
        SHUFFLE_TIMING.HOLD_BEFORE_SHAKE,
      );
      const shakeElapsed = consumeElapsed(SHUFFLE_TIMING.SHAKE_DURATION);
      const holdAfterShakeElapsed = consumeElapsed(
        SHUFFLE_TIMING.HOLD_AFTER_SHAKE,
      );
      const swirlOneElapsed = consumeElapsed(SHUFFLE_TIMING.SWIRL_DURATION);
      const swirlResetOneElapsed = consumeElapsed(
        SHUFFLE_TIMING.SWIRL_RESET_DURATION,
      );
      const swirlTwoElapsed = consumeElapsed(SHUFFLE_TIMING.SWIRL_DURATION);
      const swirlResetTwoElapsed = consumeElapsed(
        SHUFFLE_TIMING.SWIRL_RESET_DURATION,
      );
      const expandElapsed = consumeElapsed(SHUFFLE_TIMING.EXPAND_DURATION);

      const collapseProgress =
        SHUFFLE_TIMING.COLLAPSE_DURATION > 0
          ? collapseElapsed / SHUFFLE_TIMING.COLLAPSE_DURATION
          : 1;
      const expandProgress =
        SHUFFLE_TIMING.EXPAND_DURATION > 0
          ? expandElapsed / SHUFFLE_TIMING.EXPAND_DURATION
          : 1;

      if (collapseElapsed < SHUFFLE_TIMING.COLLAPSE_DURATION) {
        fanCollapse.setValue(collapseProgress);
      } else if (expandElapsed > 0) {
        fanCollapse.setValue(1 - expandProgress);
      } else if (progress >= 1) {
        fanCollapse.setValue(0);
      } else {
        fanCollapse.setValue(1);
      }
      shuffleShake.setValue(0);

      if (swirlOneElapsed < SHUFFLE_TIMING.SWIRL_DURATION) {
        const swirlProgress =
          SHUFFLE_TIMING.SWIRL_DURATION > 0
            ? swirlOneElapsed / SHUFFLE_TIMING.SWIRL_DURATION
            : 1;
        shuffleSwirl.setValue(swirlProgress);
      } else if (swirlResetOneElapsed > 0) {
        const swirlProgress =
          SHUFFLE_TIMING.SWIRL_RESET_DURATION > 0
            ? 1 - swirlResetOneElapsed / SHUFFLE_TIMING.SWIRL_RESET_DURATION
            : 0;
        shuffleSwirl.setValue(swirlProgress);
      } else if (swirlTwoElapsed < SHUFFLE_TIMING.SWIRL_DURATION) {
        const swirlProgress =
          SHUFFLE_TIMING.SWIRL_DURATION > 0
            ? swirlTwoElapsed / SHUFFLE_TIMING.SWIRL_DURATION
            : 1;
        shuffleSwirl.setValue(swirlProgress);
      } else if (swirlResetTwoElapsed > 0) {
        const swirlProgress =
          SHUFFLE_TIMING.SWIRL_RESET_DURATION > 0
            ? 1 - swirlResetTwoElapsed / SHUFFLE_TIMING.SWIRL_RESET_DURATION
            : 0;
        shuffleSwirl.setValue(swirlProgress);
      } else {
        shuffleSwirl.setValue(0);
      }

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

      const animationSteps: Animated.CompositeAnimation[] = [];
      const collapseRemaining =
        SHUFFLE_TIMING.COLLAPSE_DURATION - collapseElapsed;
      if (collapseRemaining > 0) {
        animationSteps.push(
          Animated.timing(fanCollapse, {
            toValue: 1,
            duration: collapseRemaining,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        );
      }
      const holdBeforeShakeRemaining =
        SHUFFLE_TIMING.HOLD_BEFORE_SHAKE - holdBeforeShakeElapsed;
      if (holdBeforeShakeRemaining > 0) {
        animationSteps.push(Animated.delay(holdBeforeShakeRemaining));
      }
      if (shakeElapsed < SHUFFLE_TIMING.SHAKE_DURATION) {
        animationSteps.push(Animated.sequence(shakeSteps));
      }
      const holdAfterShakeRemaining =
        SHUFFLE_TIMING.HOLD_AFTER_SHAKE - holdAfterShakeElapsed;
      if (holdAfterShakeRemaining > 0) {
        animationSteps.push(Animated.delay(holdAfterShakeRemaining));
      }
      const swirlOneRemaining = SHUFFLE_TIMING.SWIRL_DURATION - swirlOneElapsed;
      if (swirlOneRemaining > 0) {
        animationSteps.push(
          Animated.timing(shuffleSwirl, {
            toValue: 1,
            duration: swirlOneRemaining,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        );
      }
      const swirlResetOneRemaining =
        SHUFFLE_TIMING.SWIRL_RESET_DURATION - swirlResetOneElapsed;
      if (swirlResetOneRemaining > 0) {
        animationSteps.push(
          Animated.timing(shuffleSwirl, {
            toValue: 0,
            duration: swirlResetOneRemaining,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        );
      }
      const swirlTwoRemaining = SHUFFLE_TIMING.SWIRL_DURATION - swirlTwoElapsed;
      if (swirlTwoRemaining > 0) {
        animationSteps.push(
          Animated.timing(shuffleSwirl, {
            toValue: 1,
            duration: swirlTwoRemaining,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        );
      }
      const swirlResetTwoRemaining =
        SHUFFLE_TIMING.SWIRL_RESET_DURATION - swirlResetTwoElapsed;
      if (swirlResetTwoRemaining > 0) {
        animationSteps.push(
          Animated.timing(shuffleSwirl, {
            toValue: 0,
            duration: swirlResetTwoRemaining,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        );
      }
      const expandRemaining = SHUFFLE_TIMING.EXPAND_DURATION - expandElapsed;
      if (expandRemaining > 0) {
        animationSteps.push(
          Animated.timing(fanCollapse, {
            toValue: 0,
            duration: expandRemaining,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        );
      }

      const animation = Animated.sequence(animationSteps);
      shuffleAnimRef.current = animation;
      animation.start(({ finished }) => {
        if (finished) {
          handleShuffleDone();
        }
      });
    },
    [fanCollapse, handleShuffleDone, shuffleShake, shuffleSwirl],
  );

  useEffect(() => {
    if (shuffleStartRequest < 1) {
      return;
    }
    startShuffle(SHUFFLE_START_PROGRESS_ON_OPEN);
  }, [shuffleStartRequest, startShuffle]);

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
    clearCardInteractionLock();
    startShuffle();
  }, [clearCardInteractionLock, isShuffling, startShuffle]);

  const handleCardTap = useCallback(() => {
    if (isCardTransitioningRef.current) {
      return;
    }
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
      lockCardInteraction(CARD_FLIP_DURATION_MS + 220);
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
      lockCardInteraction(CARD_FLIP_DURATION_MS + 80);
      setIsFront((prev) => !prev);
      return;
    }

    lockCardInteraction(CARD_FLIP_DURATION_MS + 80);
    setIsFront((prev) => !prev);
  }, [
    currentCard,
    detailBgNode,
    detailFullNode,
    flipPair,
    frontNode,
    isDetailMode,
    isFront,
    lockCardInteraction,
  ]);

  const handleDetailBack = useCallback(() => {
    if (isCardTransitioningRef.current) {
      return;
    }
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
    lockCardInteraction(CARD_FLIP_DURATION_MS + 220);
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
  }, [backNode, currentCard, frontNode, lockCardInteraction]);

  const handleConfirmSelection = useCallback(
    (confirmed: boolean) => {
      if (confirmed) {
        selectionAnim.setValue(0);
        setIsConfirmOpen(false);
        setSelectedSlot(null);
        setSelectedSlots([]);
        if (drawMode === "triple") {
          drawTripleCards(true);
        } else {
          drawNextCard(true);
        }
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
        setSelectedSlots([]);
      });
    },
    [drawMode, drawNextCard, drawTripleCards, selectionAnim],
  );

  const handleSelectFromFan = useCallback(
    (slotIndex: number) => {
      if (isShuffling) {
        return;
      }
      if (drawMode === "triple") {
        const alreadySelected = selectedSlots.includes(slotIndex);
        if (isConfirmOpen && alreadySelected && selectedSlots.length === 3) {
          handleConfirmSelection(true);
          return;
        }
        if (alreadySelected) {
          const next = selectedSlots.filter((slot) => slot !== slotIndex);
          setSelectedSlots(next);
          if (next.length < 3) {
            selectionAnim.setValue(0);
            setIsConfirmOpen(false);
          }
          return;
        }
        if (selectedSlots.length >= 3) {
          return;
        }
        const next = [...selectedSlots, slotIndex];
        setSelectedSlots(next);
        if (next.length === 3) {
          setIsConfirmOpen(true);
          Animated.timing(selectionAnim, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        }
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
      drawMode,
      isConfirmOpen,
      isShuffling,
      selectionAnim,
      selectedSlot,
      selectedSlots,
    ],
  );

  const canSwitchDrawMode =
    !currentCard &&
    selectedSlot === null &&
    selectedSlots.length === 0 &&
    !isConfirmOpen &&
    !isShuffling;

  const toggleDrawMode = useCallback(() => {
    if (!canSwitchDrawMode) {
      return;
    }
    selectionAnim.setValue(0);
    setIsConfirmOpen(false);
    setSelectedSlot(null);
    setSelectedSlots([]);
    setTripleCards([]);
    setActiveTripleCardIndex(0);
    setDrawMode((prev) => (prev === "single" ? "triple" : "single"));
  }, [canSwitchDrawMode, selectionAnim]);

  const canSwipeTripleCards = tripleCards.length === 3 && currentCard !== null;
  const handleTripleSwipe = useCallback(
    (direction: "next" | "prev") => {
      if (!canSwipeTripleCards || isCardTransitioningRef.current) {
        return;
      }
      const delta = direction === "next" ? 1 : -1;
      const nextIndex =
        (activeTripleCardIndex + delta + tripleCards.length) %
        tripleCards.length;
      const nextCard = tripleCards[nextIndex];
      if (!nextCard) {
        return;
      }
      setActiveTripleCardIndex(nextIndex);
      setAutoFlipNext(true);
      setCurrentCard(nextCard);
      setIsFront(false);
      persistLastCard(nextCard);
    },
    [activeTripleCardIndex, canSwipeTripleCards, persistLastCard, tripleCards],
  );

  const swipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          canSwipeTripleCards &&
          Math.abs(gestureState.dx) > 12 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderRelease: (_, gestureState) => {
          if (!canSwipeTripleCards) {
            return;
          }
          if (gestureState.dx <= -36 || gestureState.vx <= -0.35) {
            handleTripleSwipe("next");
            return;
          }
          if (gestureState.dx >= 36 || gestureState.vx >= 0.35) {
            handleTripleSwipe("prev");
          }
        },
      }),
    [canSwipeTripleCards, handleTripleSwipe],
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
  const showIosDetachedDetailOverlay =
    Platform.OS === "ios" &&
    isDetailMode &&
    (isFront || isIosDetailOverlayHeld);
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
      Animated.sequence([
        Animated.timing(tapHintAnim, {
          toValue: 1,
          duration: isConfirmOpen ? 700 : 900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(tapHintAnim, {
          toValue: 0,
          duration: isConfirmOpen ? 700 : 900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
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
  const selectedJournalEntry = selectedJournalEntryId
    ? (journalEntries.find((entry) => entry.id === selectedJournalEntryId) ??
      null)
    : null;
  const selectedJournalCard = selectedJournalEntry
    ? (cardsById.get(selectedJournalEntry.cardId) ?? null)
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
  const journalPeekText = useMemo(() => {
    if (!currentCard) {
      return "No description available.";
    }
    const lines = buildDetailLines(currentCard).slice(1);
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
  }, [currentCard]);
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
  const renderJournalEntry = useCallback(({ item }: { item: JournalEntry }) => {
    const card = cardsById.get(item.cardId) ?? null;
    const title = card?.title ?? "Card";
    return (
      <Pressable
        style={styles.journalEntry}
        onPress={() => {
          setSelectedJournalEntryId(item.id);
          setIsJournalEntriesOpen(false);
        }}
        accessibilityLabel={`Open journal entry for ${title}`}
      >
        <View style={styles.journalEntryThumb}>
          {card ? (
            <Image source={card.image} style={styles.journalEntryThumbImage} />
          ) : (
            <View style={styles.thumbnailFallback} />
          )}
        </View>
        <View style={styles.journalEntryContent}>
          <Text style={styles.journalEntryTitle}>{title}</Text>
          <Text style={styles.journalEntryDate}>
            {formatHistoryDate(item.createdAt)}
          </Text>
          <Text style={styles.journalEntryBody} numberOfLines={2}>
            {item.entry}
          </Text>
        </View>
      </Pressable>
    );
  }, []);

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
              <View style={styles.tapHintWrap}>
                {isConfirmOpen ? (
                  <>
                    <Animated.Text
                      pointerEvents="none"
                      style={[
                        styles.tapHint,
                        styles.tapHintConfirm,
                        styles.tapHintLayer,
                        styles.tapHintGlowFar,
                        {
                          opacity: tapHintAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.24, 0.72],
                          }),
                          transform: [
                            {
                              scale: tapHintAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1.01, 1.08],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      Tap again to confirm
                    </Animated.Text>
                    <Animated.Text
                      pointerEvents="none"
                      style={[
                        styles.tapHint,
                        styles.tapHintConfirm,
                        styles.tapHintLayer,
                        styles.tapHintGlowNear,
                        {
                          opacity: tapHintAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.4, 0.95],
                          }),
                          transform: [
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
                      Tap again to confirm
                    </Animated.Text>
                  </>
                ) : null}
                <Animated.Text
                  style={[
                    styles.tapHint,
                    isConfirmOpen ? styles.tapHintConfirm : null,
                    isConfirmOpen ? styles.tapHintCoreConfirm : null,
                    {
                      opacity: tapHintAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: isConfirmOpen ? [0.86, 1] : [0.75, 1],
                      }),
                      transform: [
                        {
                          scale: tapHintAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: isConfirmOpen ? [1, 1.02] : [1, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  {isConfirmOpen
                    ? "Tap again to confirm"
                    : drawMode === "triple"
                      ? "Tap 3 cards"
                      : "Tap a card"}
                </Animated.Text>
              </View>
            ) : null}
            {currentCard ? (
              <View
                style={[styles.cardWrapper, { width: cardWidth }]}
                {...(canSwipeTripleCards ? swipeResponder.panHandlers : {})}
              >
                <CardFlip
                  key={`${currentCard.id}:${isDetailMode ? "detail" : "front"}:${flipPair?.front ? "hasFront" : "noFront"}`}
                  onBeforeFlip={handleCardTap}
                  isFront={isFront}
                  front={flipPair?.front ?? frontNode}
                  back={flipPair?.back ?? backNode}
                  disabled={isCardInteractionLocked}
                  style={[
                    styles.cardArea,
                    {
                      width: cardWidth,
                      aspectRatio: 2 / 3,
                    },
                  ]}
                />
                {!isDetailMode ? (
                  <View style={styles.readMoreHintWrap}>
                    <Animated.Text
                      pointerEvents="none"
                      style={[
                        styles.readMoreHint,
                        styles.readMoreHintSmall,
                        styles.readMoreHintLayer,
                        styles.readMoreHintGlowFar,
                        {
                          opacity: readMoreAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.24, 0.68],
                          }),
                          transform: [
                            {
                              scale: readMoreAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1, 1.11],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      Tap to read more
                    </Animated.Text>
                    <Animated.Text
                      pointerEvents="none"
                      style={[
                        styles.readMoreHint,
                        styles.readMoreHintSmall,
                        styles.readMoreHintLayer,
                        styles.readMoreHintGlowNear,
                        {
                          opacity: readMoreAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.36, 0.92],
                          }),
                          transform: [
                            {
                              scale: readMoreAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.99, 1.08],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      Tap to read more
                    </Animated.Text>
                    <Animated.Text
                      style={[
                        styles.readMoreHint,
                        styles.readMoreHintSmall,
                        styles.readMoreHintCore,
                        {
                          opacity: readMoreAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.78, 1],
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
                  </View>
                ) : null}
                {canSwipeTripleCards ? (
                  <View style={styles.swipeHintWrap}>
                    <Text style={styles.swipeHint}>
                      {`Card ${activeTripleCardIndex + 1} of 3`}
                    </Text>
                    <Text style={styles.swipeHintSub}>Swipe left/right</Text>
                  </View>
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
                {showIosDetachedDetailOverlay ? (
                  <View
                    pointerEvents="none"
                    style={[
                      styles.detailOverlayFloat,
                      styles.detailOverlayBgLayer,
                      { height: cardWidth * 1.5 },
                    ]}
                  >
                    {currentCard?.detailImage ? (
                      <Image
                        source={currentCard.detailImage}
                        style={styles.cardImage}
                      />
                    ) : null}
                  </View>
                ) : null}
                {showIosDetachedDetailOverlay ? (
                  <View
                    pointerEvents="box-none"
                    style={[
                      styles.detailOverlayFloat,
                      styles.detailOverlayTextLayer,
                      { height: cardWidth * 1.5 },
                    ]}
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
                    const isSelected =
                      drawMode === "triple"
                        ? selectedSlots.includes(index)
                        : selectedSlot === index;
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
                              ...(drawMode === "single" && isSelected
                                ? [{ translateY: pullOutY }]
                                : []),
                              ...(drawMode === "triple" && isSelected
                                ? [{ translateY: fanCardHeight * 0.14 }]
                                : []),
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
              visible={selectedJournalEntryId !== null}
              animationType="fade"
            >
              <View
                style={[styles.journalOverlay, styles.journalDetailOverlay]}
              >
                <View
                  style={[
                    styles.modalCard,
                    styles.journalCard,
                    styles.journalDetailCard,
                    {
                      width: journalDetailWidth,
                      transform: [{ translateX: journalDetailOffsetX }],
                    },
                  ]}
                >
                  {selectedJournalEntry ? (
                    <ImageBackground
                      source={scrollImage}
                      style={styles.journalDetailBg}
                      imageStyle={styles.journalDetailBgImage}
                      resizeMode="stretch"
                    >
                      <View
                        style={[
                          styles.journalDetailContent,
                          { width: journalDetailContentWidth },
                        ]}
                      >
                        <Text
                          allowFontScaling={false}
                          style={styles.journalDetailTitle}
                        >
                          {selectedJournalCard?.title ?? "Card"}
                        </Text>
                        <Text
                          allowFontScaling={false}
                          style={styles.journalDetailDate}
                        >
                          {formatHistoryDate(selectedJournalEntry.createdAt)}
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
                          <ScrollView
                            contentContainerStyle={
                              styles.journalReflectionScroll
                            }
                            style={styles.journalReflectionScrollArea}
                            showsVerticalScrollIndicator={false}
                          >
                            <Text style={styles.journalEntryDetailBody}>
                              {selectedJournalEntry.entry}
                            </Text>
                          </ScrollView>
                        </View>
                        <ThemedButton
                          label="Close"
                          onPress={() => {
                            setSelectedJournalEntryId(null);
                            setIsJournalEntriesOpen(true);
                          }}
                          variant="secondary"
                          style={styles.journalCloseButton}
                          labelStyle={styles.journalCloseLabel}
                        />
                      </View>
                    </ImageBackground>
                  ) : (
                    <ThemedButton
                      label="Close"
                      onPress={() => {
                        setSelectedJournalEntryId(null);
                        setIsJournalEntriesOpen(true);
                      }}
                      variant="secondary"
                      style={styles.journalCloseButton}
                      labelStyle={styles.journalCloseLabel}
                    />
                  )}
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
              <KeyboardAvoidingView
                style={styles.modalKeyboardAvoid}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={insets.top + spacing.md}
              >
                <View
                  style={[styles.modalOverlay, styles.journalComposeOverlay]}
                >
                  <View
                    style={[
                      styles.modalCard,
                      styles.journalCard,
                      styles.journalComposeCard,
                      {
                        width: journalComposeWidth,
                        transform: [{ translateX: journalComposeOffsetX }],
                      },
                    ]}
                  >
                    <ImageBackground
                      source={scrollImage}
                      style={styles.journalComposeBg}
                      imageStyle={styles.journalComposeBgImage}
                      resizeMode="stretch"
                    >
                      <View
                        style={[
                          styles.journalComposeContent,
                          { width: journalContentWidth },
                        ]}
                      >
                        <Text
                          allowFontScaling={false}
                          adjustsFontSizeToFit
                          minimumFontScale={0.68}
                          numberOfLines={2}
                          style={[styles.modalSubtitle, styles.journalSubtitle]}
                        >
                          {currentCard?.title ?? "Card"}
                        </Text>
                        <View style={styles.journalPeekPanel}>
                          <ScrollView
                            style={styles.journalPeekScrollArea}
                            contentContainerStyle={styles.journalPeekScroll}
                            showsVerticalScrollIndicator={false}
                          >
                            <Text
                              allowFontScaling={false}
                              style={styles.journalPeekText}
                            >
                              {journalPeekText}
                            </Text>
                          </ScrollView>
                        </View>
                        <TextInput
                          value={journalDraft}
                          onChangeText={setJournalDraft}
                          placeholder="Write your thoughts..."
                          placeholderTextColor="rgba(17, 16, 15, 0.45)"
                          multiline
                          textAlignVertical="top"
                          allowFontScaling={false}
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
                    </ImageBackground>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </Modal>
          </View>
        </View>
      </ScrollView>
      <Pressable
        onPress={toggleAudio}
        accessibilityRole="button"
        accessibilityLabel={isAudioEnabled ? "Disable sound" : "Enable sound"}
        style={({ pressed }) => [
          styles.audioToggle,
          {
            left: spacing.md + insets.left,
            bottom: spacing.xs + insets.bottom,
          },
          pressed ? styles.audioTogglePressed : null,
        ]}
      >
        <Image
          source={musicToggleIcon}
          style={[
            styles.audioToggleIcon,
            !isAudioEnabled ? styles.audioToggleIconMuted : null,
          ]}
        />
      </Pressable>
      {!currentCard ? (
        <Pressable
          onPress={() => setIsJournalEntriesOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open journal entries"
          style={({ pressed }) => [
            styles.journalEntriesToggle,
            {
              right: spacing.md + insets.right + windowWidth * 0.4,
              bottom: spacing.xs + insets.bottom + windowHeight * 0.02,
            },
            pressed ? styles.audioTogglePressed : null,
          ]}
        >
          <Image source={journalToggleIcon} style={styles.journalToggleIcon} />
        </Pressable>
      ) : null}
      {!currentCard ? (
        <Pressable
          onPress={toggleDrawMode}
          disabled={!canSwitchDrawMode}
          accessibilityRole="button"
          accessibilityLabel={
            drawMode === "triple"
              ? "Switch to single-card draw mode"
              : "Switch to three-card draw mode"
          }
          style={({ pressed }) => [
            styles.drawModeToggle,
            {
              right: spacing.md + insets.right,
              bottom: spacing.xs + insets.bottom,
            },
            drawMode === "triple" ? styles.drawModeToggleActive : null,
            !canSwitchDrawMode ? styles.drawModeToggleLocked : null,
            pressed && canSwitchDrawMode ? styles.audioTogglePressed : null,
          ]}
        >
          <View style={styles.drawModeIconWrap}>
            {drawMode === "single" ? (
              [0, 1, 2].map((layer) => (
                <Image
                  key={`draw-mode-card-${layer}`}
                  source={cardBackImage}
                  style={[
                    styles.drawModeIconCard,
                    layer === 0 ? styles.drawModeCardLeft : null,
                    layer === 1 ? styles.drawModeCardCenter : null,
                    layer === 2 ? styles.drawModeCardRight : null,
                  ]}
                />
              ))
            ) : (
              <Image
                source={cardBackImage}
                style={[styles.drawModeIconCard, styles.drawModeSingleCard]}
              />
            )}
          </View>
        </Pressable>
      ) : null}
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
  audioToggle: {
    position: "absolute",
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 40,
  },
  journalEntriesToggle: {
    position: "absolute",
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 40,
  },
  drawModeToggle: {
    position: "absolute",
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 45,
  },
  drawModeToggleActive: {
    opacity: 1,
  },
  drawModeToggleLocked: {
    opacity: 0.5,
  },
  drawModeIconWrap: {
    width: 44,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    transform: [{ scale: 1.2 }],
  },
  drawModeIconCard: {
    position: "absolute",
    width: 16,
    height: 24,
    borderRadius: 2,
    resizeMode: "cover",
  },
  drawModeCardLeft: {
    transform: [{ translateX: -9 }, { rotate: "-18deg" }],
  },
  drawModeCardCenter: {
    transform: [{ translateY: -2 }],
  },
  drawModeCardRight: {
    transform: [{ translateX: 9 }, { rotate: "18deg" }],
  },
  drawModeSingleCard: {
    width: 18,
    height: 27,
    transform: [{ translateY: -1 }],
  },
  audioTogglePressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.88,
  },
  audioToggleIcon: {
    width: 110,
    height: 110,
    resizeMode: "contain",
  },
  audioToggleIconMuted: {
    opacity: 0.55,
  },
  journalToggleIcon: {
    width: 140,
    height: 140,
    resizeMode: "contain",
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
  swipeHint: {
    color: "rgba(247, 239, 218, 0.9)",
    fontSize: typography.body,
    fontFamily: appFontFamily,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  swipeHintWrap: {
    marginTop: spacing.sm,
    alignItems: "center",
  },
  swipeHintSub: {
    marginTop: 2,
    color: "rgba(247, 239, 218, 0.9)",
    fontSize: typography.body * 0.9,
    fontFamily: appFontFamily,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
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
    fontSize: Math.round((typography.subtitle + 2) * 1.3),
    fontFamily: appFontFamily,
    fontWeight: "800",
    color: "#50250E",
    textAlign: "center",
    letterSpacing: 0.6,
    textShadowColor: "rgba(255, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tapHintConfirm: {
    fontSize: Math.round((typography.subtitle + 2) * 1.3 * 0.8),
  },
  tapHintWrap: {
    position: "relative",
    alignSelf: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  tapHintLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  tapHintGlowFar: {
    color: "rgba(255, 255, 255, 0.45)",
    textShadowColor: "rgba(255, 255, 255, 0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  tapHintGlowNear: {
    color: "rgba(255, 255, 255, 0.62)",
    textShadowColor: "rgba(255, 255, 255, 0.62)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 9,
  },
  tapHintCoreConfirm: {
    color: "#50250E",
    textShadowColor: "rgba(255, 255, 255, 0.55)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  cardWrapper: {
    position: "relative",
    alignItems: "center",
  },
  cardActions: {
    width: "80%",
    maxWidth: 280,
    alignSelf: "center",
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
    color: "#50250E",
    letterSpacing: 0.3,
    fontSize: 18,
  },
  readMoreHint: {
    fontSize: Math.round(typography.subtitle * 3),
    fontFamily: appFontFamily,
    color: "#50250E",
    textAlign: "center",
    letterSpacing: 0.4,
    textShadowColor: "rgba(255, 255, 255, 0.58)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
    fontWeight: "800",
  },
  readMoreHintSmall: {
    fontSize: Math.round(typography.subtitle * 3 * 0.7),
  },
  readMoreHintWrap: {
    position: "relative",
    alignSelf: "center",
    marginTop: spacing.sm + 5,
  },
  readMoreHintLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  readMoreHintGlowFar: {
    color: "rgba(255, 255, 255, 0.45)",
    textShadowColor: "rgba(255, 255, 255, 0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  readMoreHintGlowNear: {
    color: "rgba(255, 255, 255, 0.62)",
    textShadowColor: "rgba(255, 255, 255, 0.62)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 11,
  },
  readMoreHintCore: {
    color: "#50250E",
    textShadowColor: "rgba(255, 255, 255, 0.58)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 7,
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
    left: 0,
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  detailOverlayBgLayer: {
    zIndex: 3,
  },
  detailOverlayTextLayer: {
    zIndex: 4,
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
    color: "#50250E",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: appFontFamily,
  },
  detailTitleText: {
    fontFamily: detailFontFamilyBold,
    color: "#50250E",
    fontSize: Math.round(22 * 1.3),
    fontStyle: "italic",
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  detailBodyText: {
    fontFamily: detailFontFamily,
    color: "#50250E",
    fontSize: Math.round(16 * 1.3),
    lineHeight: Math.round(23 * 1.3),
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  detailHeadingText: {
    fontFamily: detailFontFamilyBold,
    color: "#50250E",
    fontSize: Math.round(17 * 1.3),
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  detailBulletText: {
    fontFamily: detailFontFamily,
    color: "#50250E",
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
  modalKeyboardAvoid: {
    flex: 1,
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
  journalDetailOverlay: {
    paddingHorizontal: 0,
  },
  journalComposeOverlay: {
    paddingHorizontal: 0,
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
  journalComposeCard: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    borderRadius: 0,
    overflow: "visible",
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  journalDetailCard: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    borderRadius: 0,
    overflow: "visible",
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  journalDetailBg: {
    width: "100%",
    alignSelf: "center",
    minHeight: 720,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  journalDetailBgImage: {
    resizeMode: "stretch",
  },
  journalDetailScrollArea: {
    width: "100%",
  },
  journalDetailContent: {
    alignSelf: "center",
    alignItems: "center",
    paddingTop: "16%",
    paddingBottom: spacing.sm,
    marginLeft: "-9%",
  },
  journalComposeBg: {
    width: "100%",
    alignSelf: "center",
    minHeight: 700,
    paddingTop: spacing.xl + spacing.sm,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    justifyContent: "flex-start",
  },
  journalComposeContent: {
    alignSelf: "center",
    marginTop: "7.5%",
    alignItems: "center",
    marginLeft: "-9%",
  },
  journalComposeBgImage: {
    resizeMode: "stretch",
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
    color: "rgba(72, 38, 15, 0.84)",
    fontWeight: "700",
    fontSize: 34,
    lineHeight: 38,
    textAlign: "center",
    marginBottom: spacing.xs,
    fontFamily: appFontFamily,
  },
  journalDetailDate: {
    color: "rgba(72, 38, 15, 0.7)",
    textAlign: "center",
    marginBottom: spacing.sm,
    fontFamily: appFontFamily,
  },
  modalSubtitle: {
    color: colors.textSoft,
    textAlign: "center",
    marginBottom: spacing.md,
    fontFamily: appFontFamily,
  },
  journalSubtitle: {
    color: "rgba(72, 38, 15, 0.84)",
    width: "100%",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: spacing.sm,
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
    marginBottom: 2,
    fontFamily: appFontFamily,
  },
  journalEntryDate: {
    color: "rgba(17, 16, 15, 0.58)",
    fontSize: 12,
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
    width: 165,
    height: 248,
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
    color: "#50250E",
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
    color: "#50250E",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: appFontFamily,
    textAlign: "center",
  },
  journalEntryDetailBody: {
    color: "rgba(72, 38, 15, 0.9)",
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
    maxHeight: 132,
    width: "100%",
  },
  journalReflectionScroll: {
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  journalReflectionTitle: {
    color: "rgba(72, 38, 15, 0.88)",
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
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    alignSelf: "center",
    backgroundColor: "#f2c8a7",
    borderColor: "#d4a47d",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  journalCloseLabel: {
    color: "#50250E",
    letterSpacing: 0.3,
    fontSize: 18,
  },
  journalInput: {
    width: "94%",
    alignSelf: "center",
    marginTop: "5%",
    minHeight: 140,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(102, 62, 34, 0.28)",
    padding: spacing.sm,
    color: "rgba(52, 28, 14, 0.86)",
    backgroundColor: "transparent",
    fontFamily: appFontFamily,
    fontSize: 16,
    textAlign: "center",
  },
  journalPeekPanel: {
    width: "94%",
    alignSelf: "center",
    maxHeight: 280,
    borderRadius: radii.md,
    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: "transparent",
    marginBottom: spacing.sm,
  },
  journalPeekScrollArea: {
    width: "100%",
  },
  journalPeekScroll: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  journalPeekText: {
    color: "rgba(42, 21, 23, 0.88)",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    fontFamily: appFontFamily,
  },
  journalActions: {
    marginTop: "5%",
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
