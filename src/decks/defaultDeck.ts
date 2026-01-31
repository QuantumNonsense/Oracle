import type { ImageSourcePropType } from "react-native";

export type CardType = "card" | "rules" | "placeholder";

export type Card = {
  id: string;
  title: string;
  image: ImageSourcePropType;
  detailImage?: ImageSourcePropType;
  description?: string[];
  reflectionQuestions?: string[];
  type: CardType;
};

export const cardBackImage: ImageSourcePropType = require("../../assets/cards/card-back.png");

const detailBackground: ImageSourcePropType = require("../../assets/cards/MycelialDescription.png");
const cardImages: ImageSourcePropType[] = [
  require("../../assets/cards/1.png"),
  require("../../assets/cards/2.png"),
  require("../../assets/cards/3.png"),
  require("../../assets/cards/4.png"),
  require("../../assets/cards/5.png"),
  require("../../assets/cards/6.png"),
  require("../../assets/cards/7.png"),
  require("../../assets/cards/8.png"),
  require("../../assets/cards/9.png"),
  require("../../assets/cards/10.png"),
  require("../../assets/cards/11.png"),
  require("../../assets/cards/12.png"),
  require("../../assets/cards/13.png"),
  require("../../assets/cards/14.png"),
  require("../../assets/cards/15.png"),
  require("../../assets/cards/16.png"),
  require("../../assets/cards/17.png"),
  require("../../assets/cards/18.png"),
  require("../../assets/cards/19.png"),
  require("../../assets/cards/20.png"),
  require("../../assets/cards/21.png"),
  require("../../assets/cards/22.png"),
  require("../../assets/cards/23.png"),
  require("../../assets/cards/24.png"),
  require("../../assets/cards/25.png"),
  require("../../assets/cards/26.png"),
  require("../../assets/cards/27.png"),
  require("../../assets/cards/28.png"),
  require("../../assets/cards/29.png"),
  require("../../assets/cards/30.png"),
  require("../../assets/cards/31.png"),
  require("../../assets/cards/32.png"),
  require("../../assets/cards/33.png"),
  require("../../assets/cards/34.png"),
  require("../../assets/cards/35.png"),
  require("../../assets/cards/36.png"),
];

const createPlaceholderCard = (index: number): Card => ({
  id: `card-${index}`,
  title: `Card ${index}`,
  image: cardImages[index - 1] ?? cardBackImage,
  detailImage: detailBackground,
  description: [`Card ${index} description`],
  reflectionQuestions: [],
  type: "placeholder",
});

export const cards: Card[] = [
  {
    id: "mycelial-network",
    title: "Mycelial Network",
    image: cardImages[0],
    detailImage: detailBackground,
    description: [
      "The mycelial network is an underground system that connects organisms, redistributes resources, and transmits information across an ecosystem. Nothing within it exists independently.",
      "Support may be arriving quietly, indirectly, or from places you are not actively attending to. At the same time, influence moves through these same channels. Energy flows where pathways already exist. Rather than asking whether the system is good or bad, observe how energy is moving through it, and where you stand within that exchange.",
      "This card invites both trust and discernment. Some connections nourish you. Others subtly draw from you. Neither is inherently wrong, but awareness is essential. What you are connected to is shaping how you feel, how you act, and what becomes possible next.",
    ],
    reflectionQuestions: [
      "Where am I being supported in ways I haven't acknowledged?",
      "Where does my energy naturally flow, and where does it feel siphoned?",
      "What might shift if I became more intentional about my connections?",
    ],
    type: "card",
  },
  ...Array.from({ length: 35 }, (_, index) =>
    createPlaceholderCard(index + 2),
  ),
];

export const drawableCards = cards.filter((card) => card.type === "card");
export const rulesCard = cards.find((card) => card.type === "rules") ?? null;
