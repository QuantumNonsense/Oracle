import type { Card } from "../decks/defaultDeck";

export type DeckState = {
  cards: Card[];
  order: Card[];
  index: number;
};

export function shuffle(cards: Card[]): Card[] {
  const next = [...cards];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function drawNext(state: DeckState): { state: DeckState; card: Card } {
  const order = state.order.length === 0 ? shuffle(state.cards) : state.order;
  const total = order.length;
  if (total === 0) {
    return { state, card: state.cards[0] as Card };
  }
  const index = state.index % total;
  const card = order[index];
  return {
    card,
    state: {
      ...state,
      order,
      index: (index + 1) % total,
    },
  };
}
