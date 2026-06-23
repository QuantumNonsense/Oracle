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
      "Mycelium is the root-like body of a fungus, while mushrooms are the little fruiting bodies that pop up above ground. Beneath the surface, mycelium forms a living web that links roots, fungi, soil, and countless tiny organisms. Along its hidden threads, nutrients move, messages travel, and support finds its way where it's needed.",
      "This card reminds you that you are part of a wider network, even when you can't see it. Notice what quietly nourishes you, what you nourish in return, and where your energy naturally flows. Even the smallest thread can belong to something vast.",
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
      "Decomposition is nature's recycling system. Fungi, microbes, and other tiny helpers break down what has reached the end of its life and return its nutrients to the soil. Nothing stays the same forever, nothing is wasted either; what is finished simply begins changing into something new.",
      "This card invites you to loosen your grip on what has completed its purpose. Letting go does not erase its value; it simply allows that value to change form. What is softening or falling away may already be feeding a new beginning, even if its first little shoots have not appeared yet.",
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
      "Some organisms grow by drawing nutrients from a host without giving anything back. They are not evil or malicious, they are simply following a survival strategy that can slowly weaken the system supporting them.",
      "This card asks you to notice where your energy may be leaving faster than it is being restored. Parasitic dynamics can exist in relationships, habits, obligations, or thought patterns. There is no need for blame; awareness helps you see what needs a boundary, a change, or a little more balance.",
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
      "Dormancy is nature's way of protecting potential. Spores, seeds, and pieces of mycelium can quietly conserve their energy until the conditions are right for growth. They have not failed or given up. They are simply waiting for the warmth, moisture, or support they need.",
      "This card asks you to trust that your timing does not need to match anyone else's. Growth will come when the right conditions meet your readiness. Some things bloom best when they are allowed to arrive in their own time.",
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
      "Pinning is the moment tiny mushroom beginnings first appear after a period of hidden growth. The potential is finally taking shape, but it is still delicate. Small changes in moisture, airflow, temperature, or handling can help it continue or cause it to stall.",
      "This card asks you to notice what is just beginning and give it the steady care it needs. Do not rush it, crowd it, or ask it to become more than it is ready to be. New growth does not need more pressure. It needs patience, protection, and the right conditions to keep unfolding.",
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
      "Fruiting bodies are the mushrooms we see above the surface, appearing after a long period of hidden growth. They emerge when conditions are right to release their spores and begin the cycle again. Their purpose is not to last forever, but to carry what has grown into its next chapter.",
      "This card invites you to fully enjoy what is blooming now without asking it to stay the same. Let yourself be seen, share what you have created, and trust what happens after you release it. Expression is not the end of the cycle. It is a gift that gives something new a chance to begin.",
    ],
    reflectionQuestions: [
      "What in my life is reaching a point of visible expression or completion?",
      "What energy or resources will be spent by choosing visibility?",
      "What is meant to be released rather than preserved?",
    ],
    type: "card",
  },
  {
    id: "phototropism",
    title: "Phototropism",
    image: cardImages[6],
    detailImage: detailBackground,
    description: [
      "Phototropism is the way an organism adjusts its growth in response to light. Fungi do not use light for energy like plants do, but they can use it as information about direction, timing, and changing conditions. A small turn toward the right signal can be more useful than pushing harder in the wrong direction.",
      "This card invites you to let new information change your direction. You do not have to keep pushing forward simply because you have already started. Notice what has become clearer, adjust your course, and trust that a small shift in orientation can open an entirely new path.",
    ],
    reflectionQuestions: [
      "What information is influencing my direction right now?",
      "Where might a small adjustment have more impact than forceful action?",
      "What am I feeling drawn toward, and is it guidance or distraction?",
    ],
    type: "card",
  },
  {
    id: "scotophase",
    title: "Scotophase",
    image: cardImages[7],
    detailImage: detailBackground,
    description: [
      "Scotophase is the dark part of a natural light cycle. For many fungi, darkness can help protect moisture and support quiet mycelial growth beneath the surface. Darkness can create a calm, sheltered space where delicate processes continue without interruption.",
      "This card reminds you that not everything needs to be seen while it is still becoming. Some ideas, feelings, and plans grow best with a little privacy and protection before they are ready to be illuminated.",
    ],
    reflectionQuestions: [
      "Where in my life might growth benefit from less exposure or attention?",
      "What pressure to be visible, productive, or clear feels premature?",
      "How do I respond to darkness; as absence, or as protection?",
    ],
    type: "card",
  },
  {
    id: "adaptogens",
    title: "Adaptogens",
    image: cardImages[8],
    detailImage: detailBackground,
    description: [
      "Adaptogens are non-toxic mushrooms, herbs, or roots that help the body respond to stress and return to balance. Their effects may include supporting energy, focus, calm, or clarity, depending on what the body needs.",
      "This card reminds you that resilience grows through regular support. Rest, nourishing routines, and small choices can help you move through stress and find your balance again more easily. Notice what helps you feel steady, flexible, and ready for whatever comes next.",
    ],
    reflectionQuestions: [
      "What stressors in my life are ongoing rather than temporary?",
      "Where am I trying to push for change instead of supporting regulation?",
      "How might flexibility serve me better than intensity right now?",
    ],
    type: "card",
  },
  {
    id: "spores",
    title: "Spores",
    image: cardImages[9],
    detailImage: detailBackground,
    description: [
      "Spores are tiny reproductive cells that fungi release to travel through air, water, or other living things. A mushroom may release millions of spores, but only those that land in the right moisture, temperature, and environment will begin to grow.",
      "This card invites you to release what you have created without trying to control where every piece will land. Not every idea, effort, or offering will take root, and that does not make it wasted. Share what is ready, trust it to travel, and let the right conditions decide what grows next.",
    ],
    reflectionQuestions: [
      "What have I recently released, expressed, or sent outward?",
      "Am I trying to force germination where compatibility is absent?",
      "How might I trust distribution without attempting to control every outcome?",
    ],
    type: "card",
  },
  {
    id: "hyphae",
    title: "Hyphae",
    image: cardImages[10],
    detailImage: detailBackground,
    description: [
      "Hyphae are the microscopic, thread-like filaments that make up the body of a fungus. Each hypha grows by extending at its tip, pushing forward into new territory while secreting enzymes that break down the material it encounters. Unlike organisms that expand through centralized organs, fungi advance through countless individual points of outward movement. Growth is not explosive; it is continuous, incremental, and persistent.",
      "This form of extension allows fungi to explore, assess, and respond to their environment in real time. A hyphal tip changes direction when it encounters resistance, nutrient gradients, or physical barriers. Expansion is adaptive rather than rigid. Progress depends on sustained contact with what is immediately ahead, not on leaps across empty space.",
      "When this card appears, it suggests that advancement may be best achieved through steady extension rather than dramatic overhaul. Consider where small, forward-facing movements repeated consistently could accumulate into meaningful expansion. Growth at the tip requires attention to what is directly in front of you. The next step shapes the path.",
    ],
    reflectionQuestions: [
      "What immediate conditions am I encountering at the edge of growth?",
      "Am I attempting to leap ahead rather than advance incrementally?",
      "What would steady, directional extension look like here?",
    ],
    type: "card",
  },
  {
    id: "pores",
    title: "Pores",
    image: cardImages[11],
    detailImage: detailBackground,
    description: [
      "Not all fungi disperse spores through gills. In many species, including boletes and polypores, the underside of the cap is composed of tightly packed tubes that open as pores. Spores form along the inner walls of these tubes and are released through the small openings below. Though less exposed than gills, this structure still provides the necessary surface area for effective dispersal.",
      "This variation reflects a different architectural approach to the same biological function. Pores create a more compact and often more durable structure, sometimes allowing the fruiting body to persist longer in changing conditions. While the form differs, the outcome does not. The method adapts, but the purpose is preserved.",
      "When this card appears, it invites reflection on how function can be maintained across changing forms. A familiar approach may not be the only viable one. What matters is not adherence to a single method, but whether the structure in place supports the intended result. Variation does not imply deviation; it may be the most effective response to present conditions.",
    ],
    reflectionQuestions: [
      "Where am I using the same approach, hoping for different outcomes?",
      "Am I holding onto a method because it is familiar rather than effective?",
      "What alternative structure could support the same goal more efficiently?",
    ],
    type: "card",
  },
  {
    id: "lamellae",
    title: "Lamellae",
    image: cardImages[12],
    detailImage: detailBackground,
    description: [
      "Lamellae, or gills, are the thin, blade-like structures located on the underside of many mushroom caps. Their primary function is to increase surface area for spore production. By arranging tissue into closely spaced plates, the mushroom multiplies the space available for reproductive cells without dramatically increasing overall size. This architectural strategy allows for immense spore output within a compact form.",
      "The effectiveness of a mushroom's reproduction depends not only on its presence, but on how its internal structures are organized. The spacing, density, and exposure of gills influence airflow and spore dispersal efficiency. The underside, often unseen, determines the scale of what can be released into the environment. Form governs function.",
      "When this card appears, it invites reflection on design rather than effort. Output is shaped by structure. The way you organize your time, systems, communication, or resources influences what you are capable of generating. Consider whether your underlying architecture supports the scale of release you intend. Capacity is not only about volume, it is about arrangement.",
    ],
    reflectionQuestions: [
      "What underlying structures support the output I'm producing?",
      "Is my design limiting capacity more than effort is?",
      "What structural adjustment would increase efficiency without increasing strain?",
    ],
    type: "card",
  },
  {
    id: "field-capacity",
    title: "Field Capacity",
    image: cardImages[13],
    detailImage: detailBackground,
    description: [
      "In mycology, field capacity refers to the proportion of water in a material that is biologically available for use. It is measured on a scale from 0 to 1, with pure water at 1.0. Fungi require a minimum level of available water to sustain metabolism, transport nutrients, and maintain cellular structure. When water activity falls below that threshold, growth slows or stops, regardless of how much total moisture the environment appears to contain.",
      "However, more is not always better. Excessive water can reduce oxygen availability within a substrate, creating conditions that inhibit fungal metabolism or favor competing organisms. Fungi are aerobic; they require oxygen as well as moisture. Productive growth occurs within a range - not at the driest edge, and not at full saturation. Viability depends on balance between availability and stability.",
      "When this card appears, it invites examination of what is functionally accessible in your environment. Resources may exist in theory, but are they usable? Support may appear abundant, but does it allow space to breathe? Systems operate within optimal ranges. Below a certain point, effort cannot compensate for depletion. Above another, saturation creates constraint. Consider not only how much surrounds you, but whether it is proportioned in a way that sustains steady function.",
    ],
    reflectionQuestions: [
      "Which of the resources in my life are actually accessible and usable right now?",
      "Am I operating below a necessary minimum, or within an over-saturated environment?",
      "What adjustment would bring my current conditions into a sustainable range?",
    ],
    type: "card",
  },
  {
    id: "cap-pileus",
    title: "Pileus",
    image: cardImages[14],
    detailImage: detailBackground,
    description: [
      "The cap, technically referred to as the pileus, is the upper structure of many mushrooms. In early development, it is often tightly curved downward, protecting the spore-producing surfaces beneath. As the mushroom matures, the cap expands, flattens, or even inverts. These shifts are not decorative; they influence airflow, moisture regulation, and the mechanics of spore dispersal.",
      "The cap does not remain fixed in one configuration. Its shape changes in accordance with developmental stage and environmental interaction. A curved margin protects immature tissues. A broadened or flattened surface improves spore release. In some species, texture and color shift as hydration levels change. The architecture adjusts as the needs of the organism change.",
      "When this card appears, it invites reflection on how your own structures may be reshaping with maturity. What once required containment may now require expansion. Adaptation of form is not inconsistency; it is responsiveness. Consider whether your current configuration matches your present function. Growth often involves restructuring, not just enlargement.",
    ],
    reflectionQuestions: [
      "What functional demands are shaping my current form?",
      "Am I holding onto an earlier configuration that no longer serves this phase?",
      "How might adjusting my structure better support what I am now meant to do?",
    ],
    type: "card",
  },
  {
    id: "substrate",
    title: "Substrate",
    image: cardImages[15],
    detailImage: detailBackground,
    description: [
      "In mycology, a substrate is the material in which a fungus grows and from which it draws nutrients. This may be decaying wood, leaf litter, soil, compost, or even living roots. Fungi do not generate their own energy from sunlight; they rely entirely on the chemical composition of the material they inhabit. Each species is adapted to specific substrates, equipped with enzymes capable of breaking down certain compounds and not others. What can grow is determined by what is available to be metabolized.",
      "Substrate provides more than nutrients; it influences moisture retention, aeration, structural stability, and microbial competition. Even if spores or living fungal tissue are present, growth cannot proceed without suitable material to sustain it. A mismatch between organism and substrate results not in failure, but in non-establishment. The environment does not accommodate every possibility.",
      "When this card appears, it invites examination of the material conditions underlying your current efforts. Ambition, intention, and effort matter, but they do not override environment. What are you attempting to grow within, and does it contain the resources required? Sometimes change does not require greater force, but different ground.",
    ],
    reflectionQuestions: [
      "Is there a mismatch between what I want to grow and where I am placing it?",
      "What conditions best support what I'm currently trying to cultivate?",
      "Would adjusting the environment alter the outcome more effectively than increasing effort?",
    ],
    type: "card",
  },
  {
    id: "veil",
    title: "Veil",
    image: cardImages[16],
    detailImage: detailBackground,
    description: [
      "In many mushroom species, a thin membrane called a veil covers and protects the developing spore-producing surfaces. The partial veil stretches from the cap to the stem, shielding the gills while the fruiting body matures. In some species, a universal veil surrounds the entire immature mushroom. As growth continues, the veil tears, leaving remnants behind - often visible as a ring on the stem or fragments on the cap.",
      "The veil functions as temporary protection. It prevents desiccation and shields delicate tissues until they are structurally ready for exposure. But once the mushroom expands, the membrane must rupture. Retaining it would restrict development and spore release. Protection that once preserved growth eventually becomes an obstacle to it.",
      "When this card appears, it suggests that something in your life may be approaching the edge of exposure. Safeguards, boundaries, or protective structures that were once necessary may now be ready to thin or tear. Consider whether continued enclosure supports growth - or inhibits it. Development requires timing, but it also requires eventual opening.",
    ],
    reflectionQuestions: [
      "Where in my life have I been protected or shielded?",
      "What might be restricted if I maintain this boundary too long?",
      "What would it look like to allow controlled exposure rather than indefinite enclosure?",
    ],
    type: "card",
  },
  {
    id: "mycorrhizae",
    title: "Mycorrhizae",
    image: cardImages[17],
    detailImage: detailBackground,
    description: [
      "Mycorrhizae are symbiotic associations between fungal networks and plant roots. The fungus extends fine filaments through the soil, increasing the plant's access to water and mineral nutrients that roots alone cannot efficiently reach. In return, the plant supplies the fungus with carbohydrates produced through photosynthesis. Neither organism is self-sufficient in this exchange; both benefit through cooperation shaped by long evolutionary history.",
      "This relationship is not sentimental, it is functional. The plant gains expanded reach into the soil. The fungus gains a reliable energy source. Forest ecosystems depend heavily on these partnerships. In many cases, seedlings struggle to establish without compatible fungal associations. The success of one partner is tied to the viability of the other.",
      "When this card appears, it invites reflection on reciprocal structures in your life; to notice where there is a genuine exchange of resources, skills, or energy. Mutualism does not imply equality of output, but balance of benefit. Consider whether your relationships operate through sustained exchange, and whether both sides are strengthened through participation.",
    ],
    reflectionQuestions: [
      "Where in my life is there ongoing exchange rather than one-sided output?",
      "What does each party contribute that the other cannot easily generate alone?",
      "Is the exchange balanced in benefit, even if not identical in form?",
    ],
    type: "card",
  },
  ...Array.from({ length: 18 }, (_, index) =>
    createPlaceholderCard(index + 19),
  ),
];

export const drawableCards = cards.filter((card) => card.type === "card");
export const rulesCard = cards.find((card) => card.type === "rules") ?? null;
