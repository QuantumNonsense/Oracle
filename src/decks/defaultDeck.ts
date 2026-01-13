import type { ImageSourcePropType } from "react-native";

export type CardType = "card" | "rules";

export type Card = {
  id: string;
  title: string;
  image: ImageSourcePropType;
  description?: string;
  type: CardType;
};

export const cardBackImage: ImageSourcePropType = require("../../assets/cards/card-back.png");

export const cards: Card[] = [
  {
    id: "ready-or-not",
    title: "Ready or Not",
    image: require("../../assets/cards/ready-or-not.png"),
    type: "card",
  },
  {
    id: "relief",
    title: "Relief",
    image: require("../../assets/cards/relief.png"),
    type: "card",
  },
  {
    id: "resurrection",
    title: "Resurrection",
    image: require("../../assets/cards/resurrection.png"),
    type: "card",
  },
  {
    id: "reverse",
    title: "Reverse",
    image: require("../../assets/cards/reverse.png"),
    type: "card",
  },
  {
    id: "skip-turn",
    title: "Skip Turn",
    image: require("../../assets/cards/skip-turn.png"),
    type: "card",
  },
  {
    id: "steal",
    title: "Steal",
    image: require("../../assets/cards/steal.png"),
    type: "card",
  },
  {
    id: "clear",
    title: "Clear",
    image: require("../../assets/cards/clear.png"),
    type: "card",
  },
  {
    id: "double-stakes",
    title: "Double Stakes",
    image: require("../../assets/cards/double-stakes.png"),
    type: "card",
  },
  {
    id: "rules",
    title: "Rules",
    image: require("../../assets/cards/rules-card.png"),
    type: "rules",
  },
];

export const drawableCards = cards.filter((card) => card.type === "card");
export const rulesCard = cards.find((card) => card.type === "rules") ?? null;
