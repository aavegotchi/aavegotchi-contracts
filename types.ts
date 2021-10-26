export interface GotchisOwned {
  id: string;
}
export interface UserGotchisOwned {
  id: string;
  gotchisOwned: GotchisOwned[];
}

export interface RarityFarmingRewardArgs {
  rarity: string[];
  kinship: string[];
  xp: string[];
  rookieXp: string[];
  rookieKinship: string[];
}

export interface RarityFarmingData {
  rarityGotchis: string[];
  kinshipGotchis: string[];
  xpGotchis: string[];
  rookieXpGotchis: string[];
  rookieKinshipGotchis: string[];
}

export interface rarityRewards {
  [id: string]: number;
}
