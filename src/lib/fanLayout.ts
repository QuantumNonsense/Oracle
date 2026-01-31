export type FanSlot = {
  x: number;
  y: number;
  rot: number;
};

type FanSlotOptions = {
  cardWidth: number;
  baseY: number;
  count?: number;
};

export const getFanSlots = ({
  cardWidth,
  baseY,
  count = 8,
}: FanSlotOptions): FanSlot[] => {
  return Array.from({ length: count }).map((_, index) => {
    const virtualIndex = index + 1;
    const offsetFromCenter = virtualIndex - 4.5;
    return {
      x: offsetFromCenter * cardWidth * 0.18,
      y: baseY + -Math.abs(offsetFromCenter) * 6,
      rot: 12 - (24 / 9) * virtualIndex,
    };
  });
};
