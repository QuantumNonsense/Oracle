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
  {
    id: "phototropism",
    title: "Phototropism",
    image: cardImages[6],
    detailImage: detailBackground,
    description: [
      "Clarity does not require acceleration, only orientation.",
      "Phototropism describes how organisms adjust their growth in response to light as a signal. In fungal systems, light does not provide energy, but information. Changes in illumination inform orientation - where growth should be directed, where it should slow, and when internal development may begin to shift toward external expression.",
      "Rather than triggering acceleration, phototropism governs alignment - emphasizing direction over speed. Growth responds by turning, leaning, or rebalancing in relation to what has become visible. This process favors precision over force. A small adjustment in direction can be more effective than sustained effort in the wrong orientation. Phototropism often becomes relevant when clarity is increasing, but the structure to support full expression is not yet complete.",
      "When this card appears, it invites you to treat awareness as a tool for navigation, not a demand for action. Light reveals options, constraints, and signals; it does not dictate outcomes. Phototropism offers a gentle reminder not to rush towards illumination, but to notice what it reveals. What is illuminated does not need to be pursued immediately, responsiveness can be selective. Orientation comes first; movement follows when the system can support it.",
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
      "Some things best develop without constant illumination or attention.",
      "In biology, scotophase refers to the dark portion of a cyclical rhythm, during which the absence of light supports specific physiological processes. In fungal systems, this phase is critical for mycelial development. Darkness helps retain moisture, conserve energy, and prevent premature environmental signaling. Rather than halting activity, the scotophase enables continuous growth by minimizing disruption and stabilizing internal processes.",
      "Mycelium grows best in darkness not because it avoids light, but because darkness provides protection. Reduced illumination allows growth to spread, connect, and integrate without being pushed toward visibility or expression. Too much light too early can dry substrates, interrupt metabolic rhythms, or trigger developmental shifts the system cannot yet sustain. In this way, darkness functions as a condition that preserves readiness rather than delaying progress.",
      "When this card appears, it suggests that something in your life is developing best outside of observation. This is not secrecy born of fear, but protection rooted in biological intelligence. Not all growth benefits from attention, feedback, or clarity while it is forming. What is protected now is preparing for a moment when responsiveness and expression can occur without harm; until then, remaining unseen is not withdrawal, but alignment with the correct phase of development.",
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
      "Resilience is cultivated through regulation, stabilizing the whole system.",
      "Adaptogens are compounds that support an organism's ability to respond to stress without becoming depleted or destabilized. Rather than pushing the system in a specific direction, they work by modulating responses to help maintain equilibrium across changing conditions. Their value lies not in intensity, but in consistency and balance.",
      "In living systems, adaptation is not achieved through constant output or resistance, but through regulation. Adaptogens do not eliminate stress; they help the system remain functional in its presence. Over time, this preserves energy, reduces extremes, and supports resilience without forcing outcomes.",
      "When this card appears, it suggests that what is needed now is not a decisive action or dramatic shift, but support that stabilizes you across variability. Remember that resilience is cultivated gradually. Adaptation is not about hardening against stress, but about becoming flexible enough to meet it without collapse. Adaptogens invite attention to what strengthens your baseline; the subtle inputs, rhythms, or supports that allow you to respond without burning out.",
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
      "Release does not guarantee arrival, what is sent out must meet the right conditions to take hold.",
      "Spores are the reproductive units of fungi: Microscopic, lightweight structures designed for dispersal across distance. A single fruiting body may release millions or even billions of spores, yet only a small fraction will ever germinate. Most will land on surfaces that cannot support growth. Some will be destroyed by ultraviolet light, desiccation, or microbial competition. Success is not determined by intention or volume, but by compatibility between spore and environment.",
      "Unlike seeds, spores contain minimal stored nutrients. They are built for travel, not endurance. Germination occurs only when moisture, temperature, substrate, and ecological space align. Until those conditions are met, the spore remains inert, not inactive, but restrained by reality. Fungal reproduction therefore relies on scale and timing rather than precision. It is a strategy rooted in probability and environmental responsiveness.",
      "When this card appears, it suggests that something has been released; an idea, effort, offering, or influence, but its outcome is not fully within your control. Dispersal is not the same as establishment. What matters now is not chasing every landing site, but understanding where conditions are truly viable. Not all efforts are meant to take root. The work of the spore is to travel. The work of the environment is to decide what comes next.",
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
      "Expansion occurs at the edge of what is known.",
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
      "The path may differ, but the purpose remains.",
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
      "Gills are the thin, blade-like structures located on the underside of many mushroom caps. Their primary function is to increase surface area for spore production. By arranging tissue into closely spaced plates, the mushroom multiplies the space available for reproductive cells without dramatically increasing overall size. This architectural strategy allows for immense spore output within a compact form.",
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
      "Growth depends not on how much is present, but on what is actually available.",
      "In mycology, water activity refers to the proportion of water in a material that is biologically available for use. It is measured on a scale from 0 to 1, with pure water at 1.0. Fungi require a minimum level of available water to sustain metabolism, transport nutrients, and maintain cellular structure. When water activity falls below that threshold, growth slows or stops, regardless of how much total moisture the environment appears to contain.",
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
    title: "Cap / Pileus",
    image: cardImages[14],
    detailImage: detailBackground,
    description: [
      "Form adapts as function evolves.",
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
      "Growth depends on the environment it is rooted in.",
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
      "Protection is temporary; growth eventually exceeds enclosure.",
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
      "Reciprocal exchange strengthens both partners.",
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
