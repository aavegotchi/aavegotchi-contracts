const { isThrowStatement } = require('typescript')

/* global ethers */
const WEARABLE_SLOT_BODY = 0
const WEARABLE_SLOT_FACE = 1
const WEARABLE_SLOT_EYES = 2
const WEARABLE_SLOT_HEAD = 3
const WEARABLE_SLOT_HAND_LEFT = 4
const WEARABLE_SLOT_HAND_RIGHT = 5
const WEARABLE_SLOT_PET = 6
const WEARABLE_SLOT_BG = 7

// all arrays that are converted into uint have their items ordeded like this:
// [etc, third item, second item, first item]
// This applies to traitModifiers, slotPositions

// traitModifiers = [Energy, Aggressiveness, Spookiness, Brain Size, Eye Shape, Eye Color]

const itemTypes = [

  {
    svgId: 0,
    name: 'The Void',
    ghstPrice: 0,
    maxQuantity: 0,
    traitModifiers: [0, 0, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: '',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 0, y: 0, width: 0, height: 0 }
  },
  {
    svgId: 1,
    name: 'Camo Hat',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [0, 1, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'head',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 32, y: 12, width: 34, height: 20 }
  },
  {
    svgId: 2,
    name: 'Camo Pants',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [0, 1, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'body',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 32, y: 48, width: 34, height: 14 }

  },
  {
    svgId: 3,
    name: 'MK2 Grenade',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [0, 1, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'hands',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 9, y: 36.5, width: 8, height: 11 }
  },
  {
    svgId: 4,
    name: 'Snow Camo Hat',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [0, 1, 1, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'hands',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 32, y: 12, width: 34, height: 20 }
  },
  {
    svgId: 5,
    name: 'Snow Camo Pants',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [0, 1, 1, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'body',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 32, y: 48, width: 34, height: 14 }
  },
  {
    svgId: 6,
    name: 'M67 Grenade',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [0, 2, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'hands',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 8.5, y: 36.5, width: 9, height: 11 }
  },
  {
    svgId: 7,
    name: 'Marine Cap',
    ghstPrice: 0,
    maxQuantity: 300,
    traitModifiers: [0, 2, 0, 1, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'head',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 31.5, y: 14.5, width: 39, height: 27 }
  },
  {
    svgId: 8,
    name: 'Marine Jacket',
    ghstPrice: 0,
    maxQuantity: 300,
    traitModifiers: [0, 2, 0, 1, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'body',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 0, y: 0, width: 0, height: 0 }
  },
  {
    svgId: 9,
    name: 'Walkie Talkie',
    ghstPrice: 0,
    maxQuantity: 300,
    traitModifiers: [1, 0, 1, 1, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'hands',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 6.5, y: 38.5, width: 7, height: 15 }
  },
  {
    svgId: 10,
    name: 'Link White Hat',
    ghstPrice: 0,
    maxQuantity: 150,
    traitModifiers: [0, 2, 0, 2, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'head',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 32, y: 11, width: 46, height: 20 }
  },
  {
    svgId: 11,
    name: 'Mess Dress',
    ghstPrice: 0,
    maxQuantity: 150,
    traitModifiers: [0, 2, 0, 2, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'body',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 0, y: 0, width: 0, height: 0 }
  },
  {
    svgId: 12,
    name: 'Link Bubbly',
    ghstPrice: 0,
    maxQuantity: 150,
    traitModifiers: [2, 0, 0, -2, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'hands',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 7.5, y: 34.5, width: 5, height: 19 }
  },
  {
    svgId: 13,
    name: 'Sergey Beard',
    ghstPrice: 0,
    maxQuantity: 50,
    traitModifiers: [-1, -1, 0, 3, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'face',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 32, y: 23, width: 34, height: 34 }
  },
  {
    svgId: 14,
    name: 'Sergey Eyes',
    ghstPrice: 0,
    maxQuantity: 50,
    traitModifiers: [0, 0, 1, 4, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'eyes',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 32, y: 26, width: 20, height: 8 }
  },
  {
    svgId: 15,
    name: 'Red Plaid',
    ghstPrice: 0,
    maxQuantity: 50,
    traitModifiers: [3, 2, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'body',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 32, y: 44, width: 40, height: 23 }
  },
  {
    svgId: 16,
    name: 'Blue Plaid',
    ghstPrice: 0,
    maxQuantity: 5,
    traitModifiers: [-4, -2, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'body',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 32, y: 44, width: 40, height: 23 }
  },
  {
    svgId: 17,
    name: 'Link Cube',
    ghstPrice: 0,
    maxQuantity: 5,
    traitModifiers: [0, 0, 0, 6, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'hands',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 7, y: 39, width: 12, height:16 }
  },
  {
    svgId: 18,
    name: 'Aave Hero Mask',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [0, 0, 1, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'face',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 34, y: 25.5, width: 38, height: 13 }
  },
  {
    svgId: 19,
    name: 'Aave Hero Shirt',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [0, 0, 1, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'body',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 32, y: 41.5, width: 40, height: 19 }
  },
  {
    svgId: 20,
    name: 'Aave Plush',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [0, 0, 1, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'hands',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 7.5, y: 38.5, width: 13, height: 13 }
  },
  {
    svgId: 21,
    name: 'Captain Aave Mask',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [1, 0, 1, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'face',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 32, y: 20, width: 42, height: 28 }
  },
  {
    svgId: 22,
    name: 'Captain Aave Suit',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [1, 0, 1, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'body',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 32, y:44, width: 50, height: 24 }
  },
  {
    svgId: 23,
    name: 'Captain Aave Shield',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [2, 0, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'hands',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 13, y: 42, width: 20, height: 20 }
  },
  {
    svgId: 24,
    name: 'Thaave Helmet',
    ghstPrice: 0,
    maxQuantity: 250,
    traitModifiers: [2, 0, 1, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'head',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 32, y: 18, width: 46, height: 24 }
  },
  {
    svgId: 25,
    name: 'Thaave Suit',
    ghstPrice: 0,
    maxQuantity: 250,
    traitModifiers: [2, 0, 1, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'body',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 32, y: 44, width: 46, height: 22 }
  },
  {
    svgId: 26,
    name: 'Thaave Hammer',
    ghstPrice: 0,
    maxQuantity: 250,
    traitModifiers: [3, 0, 0, 1, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'hands',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 7, y: 35, width: 14, height: 14 }
  },
  {
    svgId: 27,
    name: 'Marc Hair',
    ghstPrice: 0,
    maxQuantity: 100,
    traitModifiers: [2, 2, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'head',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 32, y: 16, width: 34, height: 20 }
  },
  {
    svgId: 28,
    name: 'Marc Outfit',
    ghstPrice: 0,
    maxQuantity: 100,
    traitModifiers: [2, 2, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'body',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 32, y: 44, width: 40, height: 23 }
  },
  {
    svgId: 29,
    name: 'REKT Sign',
    ghstPrice: 0,
    maxQuantity: 100,
    traitModifiers: [0, 0, 0, -4, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'handLeft',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 8.5, y: 35.5, width: 17, height: 23 }
  },
  {
    svgId: 30,
    name: 'Jordan Hair',
    ghstPrice: 0,
    maxQuantity: 50,
    traitModifiers: [0, -2, 3, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'head',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 32, y: 17, width: 50, height: 34 }
  },
  {
    svgId: 31,
    name: 'Jordan Suit',
    ghstPrice: 0,
    maxQuantity: 50,
    traitModifiers: [-3, 0, 1, 1, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'body',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 32, y: 44, width: 40, height: 23 }
  },
  {
    svgId: 32,
    name: 'Aave Flag',
    ghstPrice: 0,
    maxQuantity: 50,
    traitModifiers: [0, -2, 3, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'hands',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 6, y: 36.5, width: 12, height: 25 }
  },
  {
    svgId: 33,
    name: 'Stani Hair',
    ghstPrice: 0,
    maxQuantity: 5,
    traitModifiers: [0, -3, 0, 3, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'head',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 32, y: 15, width: 34, height: 18 }
  },
  {
    svgId: 34,
    name: 'Stani Vest',
    ghstPrice: 0,
    maxQuantity: 5,
    traitModifiers: [3, -3, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'body',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 32, y: 41, width: 34, height: 16 }
  },
  {
    svgId: 35,
    name: 'Aave Boat',
    ghstPrice: 0,
    maxQuantity: 5,
    traitModifiers: [0, -6, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'pet',
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 33.5, y: 53.5, width: 57, height: 15 }
  },

  // For testing only

  {
    svgId: 36,
    name: 'Chemise Hawaienne Shirt',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [0, -6, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'body',
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 5,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 0, y: 0, width: 0, height: 0 }
  },
  {
    svgId: 37,
    name: 'Trait Potion',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [1, 1, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: '',
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 2,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 0, y: 0, width: 0, height: 0 }
  },
  {
    svgId: 38,
    name: 'Experience Potion',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: '',
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 2,
    kinshipBonus: 0,
    experienceBonus: 200,
    dimensions: { x: 0, y: 0, width: 0, height: 0 }
  },
  {
    svgId: 39,
    name: 'Greater Kinship Potion',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: '',
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 2,
    kinshipBonus: 10,
    experienceBonus: 0,
    dimensions: { x: 0, y: 0, width: 0, height: 0 }
  },
  {
    svgId: 40,
    name: 'SantaGotchi Hat',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [2, 2, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'head',
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 0, y: 0, width: 0, height: 0 }
  },

  {
    svgId: 41,
    name: 'Collateral 8 Hat',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [2, 2, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: 'head',
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [8],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 0, y: 0, width: 0, height: 0 }
  },
  {
    svgId: 42,
    name: 'Greater Trait Potion',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [2, 2, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: '',
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 2,
    kinshipBonus: 0,
    experienceBonus: 0,
    dimensions: { x: 0, y: 0, width: 0, height: 0 }
  }

]

function eightBitIntArrayToUint (array) {
  if (array.length === 0) {
    return ethers.BigNumber.from(0)
  }
  const uint = []
  for (const num of array) {
    const value = ethers.BigNumber.from(num).toTwos(8)
    uint.unshift(value.toHexString().slice(2))
  }
  return ethers.BigNumber.from('0x' + uint.join(''))
}

function eightBitUintArrayToUint (array) {
  if (array.length === 0) {
    return ethers.BigNumber.from(0)
  }
  const uint = []
  for (const num of array) {
    const value = ethers.BigNumber.from(num)
    uint.unshift(value.toHexString().slice(2).padStart(2, '0'))
  }
  return ethers.BigNumber.from('0x' + uint.join(''))
}

function boolsArrayToUint16 (bools) {
  const uint = []
  for (const b of bools) {
    if (b) {
      uint.push('1')
    } else {
      uint.push('0')
    }
  }
  // console.log(bools)
  // console.log(uint.join(''))
  // console.log(uint.join('').padStart(16, '0'))
  // console.log('-------------')
  return parseInt(uint.join('').padStart(16, '0'), 2)
}

function sixteenBitArrayToUint (array) {
  const uint = []
  for (let item of array) {
    if (typeof item === 'string') {
      item = parseInt(item)
    }
    uint.unshift(item.toString(16).padStart(4, '0'))
  }
  if (array.length > 0) return ethers.BigNumber.from('0x' + uint.join(''))
  return ethers.BigNumber.from(0)
}
function dimensions ({ x, y, width, height }) {
  const result = []
  for (const v of [x, y, width, height]) {
    result.unshift(v.toString(16).padStart(2, '0'))
  }
  // console.log('dimensions:')
  // console.log(ethers.BigNumber.from('0x' + result.join('')))
  return ethers.BigNumber.from('0x' + result.join(''))
}

// const WEARABLE_SLOT_BODY = 0
// const WEARABLE_SLOT_FACE = 1
// const WEARABLE_SLOT_EYES = 2
// const WEARABLE_SLOT_HEAD = 3
// const WEARABLE_SLOT_HAND_LEFT = 4
// const WEARABLE_SLOT_HAND_RIGHT = 5
// const WEARABLE_SLOT_PET = 6
// const WEARABLE_SLOT_BG = 7

function stringToSlotPositions (str) {
  if (str.length === 0) {
    return 0
  } else if (str === 'head') {
    return boolsArrayToUint16([true, false, false, false])
  } else if (str === 'body') {
    return boolsArrayToUint16([true])
  } else if (str === 'hands') {
    return boolsArrayToUint16([true, true, false, false, false, false])
  } else if (str === 'handLeft') {
    return boolsArrayToUint16([true, false, false, false, false])
  } else if (str === 'handRight') {
    return boolsArrayToUint16([true, false, false, false, false, false])
  } else if (str === 'face') {
    return boolsArrayToUint16([true, false])
  } else if (str === 'pet') {
    return boolsArrayToUint16([true, false, false, false, false, false, false])
  } else if (str === 'eyes') {
    return boolsArrayToUint16([true, false, false])
  } else {
    throw (Error('Wrong slot string: ' + str))
  }
}

function getItemTypes () {
  const result = []
  for (const itemType of itemTypes) {
    itemType.traitModifiers = eightBitIntArrayToUint(itemType.traitModifiers)
    itemType.slotPositions = stringToSlotPositions(itemType.slotPositions)
    itemType.dimensions = dimensions(itemType.dimensions)
    // itemType.allowedCollaterals = sixteenBitArrayToUint(itemType.allowedCollaterals)
    result.push(itemType)
  }
  return result
}

exports.itemTypes = getItemTypes()
