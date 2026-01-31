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
  {
    id: "decomposition",
    title: "Decomposition",
    image: cardImages[1],
    detailImage: detailBackground,
    description: [
      "Decomposition is the process through which what had reached the end of its life cycle is transformed into nourishment for what follows. In natural systems, nothing is wasted, and nothing is preserved forever.",
      "This powerful process asks for cooperation rather than control. Letting something break down does not mean erasing its value or denying what it once provided. It means allowing its usefulness to change. What you release now may quietly nourish something you cannot yet see.",
      "This card invites discernment between what is ending and what is emerging. Holding too tightly to what has completed its purpose can delay renewal. Allowing decomposition creates space for reorganization, clarity, and unexpected forms of growth.",
    ],
    reflectionQuestions: [
      "What am I expending energy trying to maintain that no longer supports me?",
      "What would it mean to let this change form rather than forcing it to continue?",
      "What resources, insight, or strength might be released through this ending?",
    ],
    type: "card",
  },
  {
    id: "parasitic-growth",
    title: "Parasitic Growth",
    image: cardImages[2],
    detailImage: detailBackground,
    description: [
      "Not all growth is healthy. Some organisms survive by extracting resources without reciprocity. They're not necessarily malevolent, but their presence does drain the system from which it feeds.",
      "When this card appears, it invites honest examination of where energy is being taken without being returned.",
      "This card does not assign blame. It simply asks for awareness. Parasitic dynamics can exist in habits, obligations, relationships, or internal narratives. Recognition is the first step toward rebalancing.",
    ],
    reflectionQuestions: [
      "Where do I feel depleted after giving?",
      "Am I sustaining something that does not sustain me?",
      "What boundaries would restore balance?",
    ],
    type: "card",
  },
  {
    id: "dormancy",
    title: "Dormancy",
    image: cardImages[4],
    detailImage: detailBackground,
    description: [
      "Dormancy is discernment encoded into biology. Spores, seeds, and mycelial fragments enter dormancy not because they have failed, but because emergence under the wrong conditions would be costly or fatal. Energy is conserved, sensitivity is heightened, and responsiveness is maintained. Dormancy protects potential.",
      "When this card appears, it suggests that something within you or around you is intentionally not expressing itself yet. This may feel like stagnation, delay, or invisibility, but dormancy is not disengagement. It is readiness without exposure.",
      "This card often arises when pressure exists to act, decide, or reveal before sufficient support, clarity, or safety is present. Dormancy asks you to notice what signals you are waiting for. Not permission - conditions. Dormancy ends when the environment changes, not when impatience demands it.",
    ],
    reflectionQuestions: [
      "Where am I pressuring myself to move prematurely?",
      "What conditions would support natural re-emergence?",
      "Can I allow stillness without self-judgment?",
    ],
    type: "card",
  },
  {
    id: "pinning",
    title: "Pinning",
    image: cardImages[3],
    detailImage: detailBackground,
    description: [
      "Pinning marks the transition from potential to expression. After a period of dormancy or unseen development, something begins to take form. This stage is highly sensitive. The structure exists, but it is not yet self-sustaining. Small changes in environment, pressure, or interference can determine whether what is emergence continues or collapses.",
      "When this card appears, it warns against forcing progress. Attention matters more than action. Over-handling, over-exposing, or demanding outcomes too quickly can disrupt what is forming. At the same time, neglect can be just as damaging. This stage requires presence, restraint, and responsiveness.",
      "This card asks you to notice what is beginning; not to push it forward, but to protect the conditions that allow it to continue. Growth here is not strengthened by intensity, but by stability. Timing is not optional, it is the mechanism that drives success.",
    ],
    reflectionQuestions: [
      "What is beginning to take form in my life, even if it feels tentative or unfinished?",
      "Where might pressure, urgency, or interference be disrupting something fragile?",
      "What would it look like to support this moment rather than push it forward?",
    ],
    type: "card",
  },
  {
    id: "fruiting-bodies",
    title: "Fruiting Bodies",
    image: cardImages[5],
    detailImage: detailBackground,
    description: [
      "Fruiting bodies are the visible expression of long, unseen work, emerging only when conditions are right, and they exist for a narrow window of time. They arise fully, fulfill their purpose, and then release what they have made possible. Their function is not longevity, but transmission.",
      "This card invites you to inhabit the moment of expression while it is here; to appreciate what has emerged without demanding that it remain unchanged. This may feel like a culmination, but it is not an endpoint. What is expressed will begin to move on its own, shaping outcomes you cannot fully predict. There is no clinging in this phase, only presence.",
      "To fruit is to accept exposure, and to allow what has formed to exist beyond your control. Fruiting bodies emerge, release what they are meant to release, and then dissolve back into the system, enriching what may follow them. In this way, expression is not an ending, but a gift forward. What you allow to bloom now becomes nourishment for what will come next.",
    ],
    reflectionQuestions: [
      "What in my life is reaching a point of visible expression or completion?",
      "What energy or resources will be spent by choosing visibility?",
      "What is meant to be released rather than preserved?",
    ],
    type: "card",
  },
  ...Array.from({ length: 30 }, (_, index) =>
    createPlaceholderCard(index + 7),
  ),
];

export const drawableCards = cards.filter((card) => card.type === "card");
export const rulesCard = cards.find((card) => card.type === "rules") ?? null;
