import { BigNumberish } from "@ethersproject/bignumber";

type Category = 0 | 1 | 2 | 3;

export interface SleeveObject {
  id: string;
  svg: string;
}

export interface Dimensions {
  x: BigNumberish;
  y: BigNumberish;
  width: BigNumberish;
  height: BigNumberish;
}

export interface SideDimensions {
  itemId: BigNumberish;
  name?: string;
  side: string;
  dimensions: Dimensions;
}

export interface Exceptions {
  itemId: BigNumberish;
  slotPosition: BigNumberish;
  side: string;
  exceptionBool: boolean;
}

export interface Sleeves {
  sleeveId: BigNumberish;
  wearableId: BigNumberish;
}

export interface ItemTypeInput {
  name: string;
  description: string;
  svgId: BigNumberish;
  minLevel: BigNumberish;
  canBeTransferred: boolean;
  totalQuantity: BigNumberish;
  maxQuantity: BigNumberish;
  setId: BigNumberish[];
  author: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  dimensions: Dimensions;
  sideDimensions?: SideDimensions;
  sleeves?: Sleeves;
  allowedCollaterals: BigNumberish[];
  ghstPrice: BigNumberish | BigNumberish;
  traitModifiers: [
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish
  ];
  slotPositions: Slot;
  category: Category;
  experienceBonus: BigNumberish;
  kinshipBonus: BigNumberish;
  rarityScoreModifier?: BigNumberish;
  canPurchaseWithGhst: boolean;
}

export type rarityLevel =
  | "common"
  | "uncommon"
  | "rare"
  | "legendary"
  | "mythical"
  | "godlike";

export interface ItemTypeInputNew {
  name: string;
  description: string;
  svgId: BigNumberish;
  minLevel: BigNumberish;
  canBeTransferred: boolean;
  rarityLevel?: rarityLevel;
  setId: BigNumberish[];
  author: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  dimensions: Dimensions;
  allowedCollaterals: BigNumberish[];
  ghstPrice: BigNumberish;
  traitModifiers: [
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish
  ];
  slotPositions: Slot;
  category: Category;
  experienceBonus: BigNumberish;
  kinshipBonus: BigNumberish;
  rarityScoreModifier?: BigNumberish;
  canPurchaseWithGhst: boolean;
  totalQuantity?: BigNumberish;
  maxQuantity?: BigNumberish;
}

export interface ItemTypeOutput {
  name: string;
  description: string;
  svgId: BigNumberish;
  minLevel: BigNumberish;
  canBeTransferred: boolean;
  totalQuantity: BigNumberish;
  maxQuantity: BigNumberish;
  setId: BigNumberish[];
  author: string;
  dimensions: Dimensions;
  allowedCollaterals: BigNumberish[];
  ghstPrice: BigNumberish;
  traitModifiers: [
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish
  ];
  slotPositions: [
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean
  ];
  category: Category;
  experienceBonus: BigNumberish;
  kinshipBonus: BigNumberish;
  rarityScoreModifier: BigNumberish;
  canPurchaseWithGhst: boolean;
}

type Slot =
  | "none"
  | "body"
  | "face"
  | "eyes"
  | "head"
  | "hands"
  | "handLeft"
  | "handRight"
  | "pet"
  | "background";

export function stringToSlotPositions(
  str: Slot
): [
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean
] {
  if (str.length === 0)
    return [
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ];
  // Slot 0 Body
  else if (str === "body")
    return [
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ];
  // Slot 1 Face
  else if (str === "face")
    return [
      false,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ];
  // Slot 2 Eyes
  else if (str === "eyes")
    return [
      false,
      false,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ];
  // Slot 3 Head
  else if (str === "head")
    return [
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ];
  // Slot 4/5 Either hand
  else if (str === "hands")
    return [
      false,
      false,
      false,
      false,
      true,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ];
  // Slot 4 Left hand
  else if (str === "handLeft")
    return [
      false,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ];
  // Slot 5 Right Hand
  else if (str === "handRight")
    return [
      false,
      false,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ];
  // Slot 6 Pet
  else if (str === "pet")
    return [
      false,
      false,
      false,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ];
  // Slot 7 Background
  else if (str === "background")
    return [
      false,
      false,
      false,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ];
  else if (str === "none")
    return [
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ];
  else {
    throw Error("Wrong slot string: " + str);
  }
}

export function calculateRarityScoreModifier(maxQuantity: number): number {
  if (maxQuantity >= 1000) return 1;
  if (maxQuantity >= 500) return 2;
  if (maxQuantity >= 250) return 5;
  if (maxQuantity >= 100) return 10;
  if (maxQuantity >= 10) return 20;
  if (maxQuantity >= 1) return 50;
  return 0;
}

export function getItemTypes(
  itemTypes: ItemTypeInputNew[],
  ethers: any
): ItemTypeOutput[] {
  const result = [];
  for (const itemType of itemTypes) {
    let maxQuantity: number = rarityLevelToMaxQuantity(itemType.rarityLevel);

    let itemTypeOut: ItemTypeOutput = {
      ...itemType,
      slotPositions: stringToSlotPositions(itemType.slotPositions),
      ghstPrice: ethers.utils.parseEther(
        rarityLevelToGhstPrice(itemType.rarityLevel)
      ),
      rarityScoreModifier: calculateRarityScoreModifier(maxQuantity),
      maxQuantity: maxQuantity,
      totalQuantity: 0, //New items always start at 0
      name: itemType.name.trim(), //Trim the name to remove empty spaces
    };

    // const reducer = (prev: BigNumberish, cur: BigNumberish) =>
    //   Number(prev) + Math.abs(Number(cur));
    // let traitBoosters = itemType.traitModifiers.reduce(reducer, 0);
    // if (itemType.category !== 1) {
    //   if (traitBoosters !== rarityLevelToTraitBoosters(itemType.rarityLevel)) {
    //     throw Error(`Trait Booster for ${itemType.name} does not match rarity`);
    //   }
    // }

    if (!Array.isArray(itemType.allowedCollaterals)) {
      throw Error("Is not array.");
    }
    result.push(itemTypeOut);
  }
  return result;
}

export function getAllItemTypes(
  itemTypes: ItemTypeInputNew[],
  ethers: any
): ItemTypeOutput[] {
  const result = [];
  for (const itemType of itemTypes) {
    const maxQuantity = itemType.maxQuantity
      ? Number(itemType.maxQuantity)
      : rarityLevelToMaxQuantity(itemType.rarityLevel);
    const ghstPrice = itemType.ghstPrice
      ? itemType.ghstPrice.toString()
      : rarityLevelToGhstPrice(itemType.rarityLevel);

    let itemTypeOut: ItemTypeOutput = {
      ...itemType,
      slotPositions: stringToSlotPositions(itemType.slotPositions),
      ghstPrice: ethers.utils.parseEther(ghstPrice),
      rarityScoreModifier: calculateRarityScoreModifier(maxQuantity),
      maxQuantity: maxQuantity,
      totalQuantity: 0, //New items always start at 0
      name: itemType.name.trim(), //Trim the name to remove empty spaces
    };

    if (!Array.isArray(itemType.allowedCollaterals)) {
      throw Error("Is not array.");
    }
    result.push(itemTypeOut);
  }
  return result;
}

export function getBaadgeItemTypes(
  itemTypes: ItemTypeInputNew[]
): ItemTypeOutput[] {
  const result = [];
  for (const itemType of itemTypes) {
    let itemTypeOut: ItemTypeOutput = {
      ...itemType,
      slotPositions: stringToSlotPositions(itemType.slotPositions),
      ghstPrice: "0",
      rarityScoreModifier: "0",
      maxQuantity: itemType.maxQuantity ? itemType.maxQuantity : 0,
      totalQuantity: 0, //New items always start at 0
      name: itemType.name.trim(), //Trim the name to remove empty spaces
    };

    const reducer = (prev: BigNumberish, cur: BigNumberish) =>
      Number(prev) + Math.abs(Number(cur));
    let traitBoosters = itemType.traitModifiers.reduce(reducer, 0);

    if (itemType.category !== 1) {
      if (traitBoosters !== rarityLevelToTraitBoosters(itemType.rarityLevel)) {
        throw Error(`Trait Booster for ${itemType.name} does not match rarity`);
      }
    }

    if (!Array.isArray(itemType.allowedCollaterals)) {
      throw Error("Is not array.");
    }
    result.push(itemTypeOut);
  }
  return result;
}

function rarityLevelToGhstPrice(
  rarityLevel: rarityLevel | undefined
): BigNumberish {
  switch (rarityLevel) {
    case "common":
      return "5";
    case "uncommon":
      return "10";
    case "rare":
      return "100";
    case "legendary":
      return "300";
    case "mythical":
      return "2000";
    case "godlike":
      return "10000";
    default:
      return "0";
  }
}

function rarityLevelToMaxQuantity(
  rarityLevel: rarityLevel | undefined
): number {
  switch (rarityLevel) {
    case "common":
      return 1000;
    case "uncommon":
      return 500;
    case "rare":
      return 250;
    case "legendary":
      return 100;
    case "mythical":
      return 50;
    case "godlike":
      return 5;
    default:
      return 0;
  }
}

export function rarityLevelToTraitBoosters(
  rarityLevel: rarityLevel | undefined
): number {
  switch (rarityLevel) {
    case "common":
      return 1;
    case "uncommon":
      return 2;
    case "rare":
      return 3;
    case "legendary":
      return 4;
    case "mythical":
      return 5;
    case "godlike":
      return 6;
    default:
      return 0;
  }
}
