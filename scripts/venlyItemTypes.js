/* global ethers hre */
/* eslint-disable  prefer-const */

//const { LedgerSigner } = require('@ethersproject/hardware-wallets')

const itemTypes = [
  {
    svgId: 206,
    name: "Biker Helmet",
    setId: [93],
    author: "xibot",
    description: "",
    dimensions: { x: 12, y: 2, width: 40, height: 30 },
    allowedCollaterals: [],
    minLevel: 1,
    ghstPrice: 100,
    maxQuantity: 250,
    traitModifiers: [0, 2, 0, 1, 0, 0],
    canPurchaseWithGhst: false,
    slotPositions: "head",
    category: 0,
    canBeTransferred: true,
    totalQuantity: 0,
    experienceBonus: 0,
    kinshipBonus: 0,
  },
  {
    svgId: 207,
    name: "Biker Jacket",
    setId: [93],
    author: "xibot",
    description: "",
    dimensions: { x: 15, y: 33, width: 34, height: 20 },
    allowedCollaterals: [],
    minLevel: 1,
    ghstPrice: 10,
    maxQuantity: 500,
    traitModifiers: [0, 2, 0, 0, 0, 0],
    canPurchaseWithGhst: false,
    slotPositions: "body",
    category: 0,
    canBeTransferred: true,
    totalQuantity: 0,
    experienceBonus: 0,
    kinshipBonus: 0,
  },
  {
    svgId: 208,
    name: "Aviators",
    setId: [93],
    author: "xibot",
    description: "",
    dimensions: { x: 15, y: 21, width: 34, height: 11 },
    allowedCollaterals: [],
    minLevel: 1,
    ghstPrice: 10,
    maxQuantity: 500,
    traitModifiers: [0, 0, 2, 0, 0, 0],
    canPurchaseWithGhst: false,
    slotPositions: "eyes",
    category: 0,
    canBeTransferred: true,
    totalQuantity: 0,
    experienceBonus: 0,
    kinshipBonus: 0,
  },
  {
    svgId: 209,
    name: "Horseshoe Mustache",
    setId: [93],
    author: "xibot",
    description: "",
    dimensions: { x: 23, y: 32, width: 18, height: 9 },
    allowedCollaterals: [],
    minLevel: 1,
    ghstPrice: 300,
    maxQuantity: 100,
    traitModifiers: [-2, 0, 2, 0, 0, 0],
    canPurchaseWithGhst: false,
    slotPositions: "face",
    category: 0,
    canBeTransferred: true,
    totalQuantity: 0,
    experienceBonus: 0,
    kinshipBonus: 0,
  },
];

function stringToSlotPositions(str) {
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
  else {
    throw Error("Wrong slot string: " + str);
  }
}

function calculateRarityScoreModifier(maxQuantity) {
  if (maxQuantity >= 1000) return 1;
  if (maxQuantity >= 500) return 2;
  if (maxQuantity >= 250) return 5;
  if (maxQuantity >= 100) return 10;
  if (maxQuantity >= 10) return 20;
  if (maxQuantity >= 1) return 50;
  return 0;
}

function getItemTypes() {
  const result = [];
  for (const itemType of itemTypes) {
    itemType.ghstPrice = ethers.utils.parseEther(itemType.ghstPrice.toString());

    itemType.slotPositions = stringToSlotPositions(itemType.slotPositions);
    if (itemType.dimensions === "" || itemType.dimensions === 0) {
      itemType.dimensions = { x: 0, y: 0, width: 0, height: 0 };
    }
    itemType.rarityScoreModifier = calculateRarityScoreModifier(
      itemType.maxQuantity
    );
    if (!Array.isArray(itemType.allowedCollaterals)) {
      throw Error("Is not array.");
    }
    result.push(itemType);
  }

  return result;
}

exports.itemTypes = getItemTypes();
