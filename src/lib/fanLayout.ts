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
  count = 6,
}: FanSlotOptions): FanSlot[] => {
  const center = (count + 1) / 2;
  const rotationStart = 12;
  const rotationEnd = -12;
  const rotationStep = count > 1 ? (rotationEnd - rotationStart) / (count - 1) : 0;

  return Array.from({ length: count }).map((_, index) => {
    const virtualIndex = index + 1;
    const offsetFromCenter = virtualIndex - center;
    return {
      x: offsetFromCenter * cardWidth * 0.18,
      y: baseY + -Math.abs(offsetFromCenter) * 6,
      rot: rotationStart + rotationStep * index,
    };
  });
};
