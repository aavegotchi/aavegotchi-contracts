export interface GotchisOwned {
  id: string;
  status: string;
}
export interface VaultGotchis {
  id: string;
}

export interface UserGotchisOwned {
  id: string;
  gotchisOwned: GotchisOwned[];
}

export interface VaultGotchisOwned {
  id: string;
  gotchis: VaultGotchis[];
}

export interface LendedGotchis {
  gotchiTokenId: string;
  lender: string;
}

export interface RarityFarmingRewardArgs {
  rarity: string[];
  kinship: string[];
  xp: string[];
  // rookieXp: string[];
  // rookieKinship: string[];
}

export interface RarityFarmingData {
  rarityGotchis: string[];
  kinshipGotchis: string[];
  xpGotchis: string[];
  // rookieXpGotchis: string[];
  // rookieKinshipGotchis: string[];
}

export interface rarityRewards {
  [id: string]: number;
}

export interface ERC721Category {
  erc721TokenAddress: string;
  category: number;
}
export type LeaderboardType = "withSetsRarityScore" | "kinship" | "experience";

export type LeaderboardDataName =
  | "rarityGotchis"
  | "kinshipGotchis"
  | "xpGotchis";
// | "rookieXpGotchis"
// | "rookieKinshipGotchis";

export interface LeaderboardAavegotchi {
  id: string;
  position?: number;
  name: string;
  baseRarityScore: string;
  modifiedRarityScore: string;
  withSetsRarityScore: string;
  numericTraits: number[];
  lastInteracted: string;
  modifiedNumericTraits: number[];
  withSetsNumericTraits: number[];
  equippedSetID: string;
  equippedSetName: string;
  equippedWearables: number[];
  stakedAmount: string;
  kinship: string;
  level: string;
  collateral: string;
  hauntId: string;
  owner: Owner;
  experience: string;
}
interface Owner {
  id: string;
}

export interface LeaderboardSortingOption {
  type: "highestBRS" | "kinshipHigh" | "xphigh";
  name: string;
  rules: {
    orderBy: LeaderboardType;
    orderDirection: "desc" | "asc";
  };
}

const leaderboardSortingOptions: Array<LeaderboardSortingOption> = [
  {
    type: "highestBRS",
    name: "Highest BRS",
    rules: {
      orderBy: "withSetsRarityScore",
      orderDirection: "desc",
    },
  },

  {
    type: "kinshipHigh",
    name: "Highest Kinship",
    rules: {
      orderBy: "kinship",
      orderDirection: "desc",
    },
  },

  {
    type: "xphigh",
    name: "Highest XP",
    rules: {
      orderBy: "experience",
      orderDirection: "desc",
    },
  },
];

export interface FoundSet {
  name: string;
  wearableIds: Array<number>;
  traitsBonuses: Array<number>;
  allowedCollaterals: Array<number>;
}

type FilterType = "all" | "only mine" | "only haunt 2";
const filterOptions: FilterType[] = ["all", "only mine", "only haunt 2"];

export interface MinigameResult {
  tokenId: string;
  score: number;
  name: string;
}

export interface MinigameGroup {
  aavegotchis: MinigameResult[];
  xpAmount: number;
}
