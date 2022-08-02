import { ItemTypeInputNew } from "../../scripts/itemTypeHelpers";

export const itemTypes: ItemTypeInputNew[] = [
  {
    svgId: 316,
    name: "Marine Jacket",
    setId: [131, 139, 140],
    author: "Xibot",
    description: "",
    dimensions: { x: 12, y: 32, width: 40, height: 23 },

    allowedCollaterals: [],
    minLevel: 1,
    ghstPrice: 100,
    rarityLevel: "rare",
    traitModifiers: [0, 2, 0, 1, 0, 0],
    canPurchaseWithGhst: false,
    slotPositions: "body",
    category: 0,
    canBeTransferred: true,
    totalQuantity: 0,
    experienceBonus: 0,
    kinshipBonus: 0,
  },
];
