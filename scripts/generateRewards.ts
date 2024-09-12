export function generateSeasonRewards(
  type: "rarity" | "kinship" | "xp",
  totalAmount: number,
  numWinners: number,
  y: number
): number[] {
  const rewards: number[] = [];
  const k =
    totalAmount /
    Array.from({ length: numWinners }, (_, i) => 1 / Math.pow(i + 1, y)).reduce(
      (a, b) => a + b,
      0
    );

  console.log(type);

  for (let rank = 1; rank <= numWinners; rank++) {
    const reward = k / Math.pow(rank, y);

    rewards.push(Number(reward.toFixed(2)));
  }

  return rewards;
}
