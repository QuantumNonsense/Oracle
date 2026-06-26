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
      "Hyphae are the microscopic threads that make up the body of a fungus. Each one grows from its tip, breaking down and absorbing nutrients as it moves through its environment. Together, countless tiny extensions allow the fungus to explore, adapt, and expand one small step at a time.",
      "This card invites you to meet the edge of what you know with curiosity. You do not need to see the entire path before moving forward. Take the next small step, learn from what you encounter, and let each new discovery shape where you grow next.",
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
      "Not all mushrooms have gills. In boletes, polypores, and other fungi, spores develop inside tiny tubes beneath the cap and exit through small openings called pores. This compact structure accomplishes the same reproductive purpose through a different design.",
      "This card reminds you that there is rarely only one right way forward. A familiar method may no longer fit, but the goal can remain the same. Let the path change when it needs to, and choose the approach that works best for where you are now.",
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
      "Gills, also called lamellae, are the thin ribbing beneath many mushroom caps where spores are produced. Their closely spaced folds create a large surface area within a small space, allowing the mushroom to release far more spores than a flat surface could hold.",
      "This card invites you to look at how your time, energy, and resources are arranged. You may not need to work harder or make more room. A thoughtful change in structure can expand what you are able to create, support, and share.",
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
      "Field capacity is the amount of water a substrate can hold after the excess has drained away. Enough moisture remains to support growth, while open spaces in the substrate still allow oxygen to move through. Healthy growth depends not only on what is present, but on whether it is available in a form the system can actually use.",
      "This card invites you to notice what truly supports you. Resources, care, and opportunities may surround you, but abundance can become overwhelming when there is no room to breathe. Hold what nourishes you, let the excess flow away, and create space for what you receive to become useful.",
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
      "The cap, also called the pileus, gives many mushrooms their familiar silhouette. It often begins curled around the delicate gills, then widens or flattens as the mushroom matures. Its changing shape protects new growth at first, then helps spores travel when the time is right.",
      "This card invites you to notice whether the shape of your life still supports who you are becoming. What once required protection may now need more room to open and expand. Allow your form to adapt as your purpose evolves.",
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
      "A substrate is the material a fungus grows in and feeds from, such as wood, soil, compost, or leaf litter. Different fungi need different substrates, and even the most promising spore cannot grow without the right nutrients, moisture, and structure beneath it.",
      "This card invites you to look closely at what is supporting your growth. Effort and intention matter, but they cannot provide everything an unsuitable environment lacks. Ask whether your current conditions contain what you need to thrive. You may not need to try harder. You may simply need different ground.",
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
      "A veil is a thin membrane that protects the delicate parts of a young mushroom as it develops. As the mushroom grows, the veil stretches and eventually tears, allowing the gills to open and release their spores. What once kept the mushroom safe must give way for growth to continue.",
      "This card invites you to notice which protections have helped you reach this point, and which may now be holding you back. You do not need to discard anything, but you may be ready to loosen your grip on something, step forward, and let more of yourself be seen.",
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
      "Mycorrhizae are partnerships between fungi and plant roots. The fungus helps the plant reach more water and nutrients through the soil, while the plant shares sugars made through photosynthesis. Together, they can access and sustain more than either could alone.",
      "This card invites you to notice and foster relationships in your life that expand what is possible for everyone involved. Remember that reciprocity does not mean giving the exact same thing in equal amounts; it means each person brings something valuable, and the connection leaves both sides stronger, better supported, and able to reach a little farther.",
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
