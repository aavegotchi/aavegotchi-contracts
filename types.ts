export interface GotchisOwned {
  id: string;
}
export interface UserGotchisOwned {
  id: string;
  gotchisOwned: GotchisOwned[];
}

export interface RarityFarmingRewardArgs{
  rarity: string[];
  kinship: string[];
  xp: string[];
}

export interface RarityFarmingData{
  rarityGotchis: string[];
  kinshipGotchis: string[];
  xpGotchis:string[]
}

export interface rarityRewards{
  [id:string]: number
}
