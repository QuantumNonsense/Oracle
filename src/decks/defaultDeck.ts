import type { ImageSourcePropType } from "react-native";

export type CardType = "card" | "rules";

export type Card = {
  id: string;
  title: string;
  image: ImageSourcePropType;
  detailImage?: ImageSourcePropType;
  description?: string;
  type: CardType;
};

export const cardBackImage: ImageSourcePropType = require("../../assets/cards/card-back.png");

export const cards: Card[] = [
  {
    id: "mycelial-network",
    title: "Mycelial Network",
    image: require("../../assets/cards/MycOracle.Mycelial.Network.png"),
    detailImage: require("../../assets/cards/MycelialDescription.png"),
    type: "card",
  },
];

export const drawableCards = cards.filter((card) => card.type === "card");
export const rulesCard = cards.find((card) => card.type === "rules") ?? null;
