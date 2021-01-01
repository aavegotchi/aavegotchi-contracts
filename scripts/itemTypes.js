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
    dimensions: { x: 15, y: 2, width: 34, height: 20 }
  },
  {
    svgId: 2,
    name: 'Camo Pants',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [0, 1, 0, 0, 0, 0],

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
    dimensions: { x: 15, y: 41, width: 34, height: 14 }

  },
  {
    svgId: 3,
    name: 'MK2 Grenade',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [0, 1, 0, 0, 0, 0],

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
    dimensions: { x: 5, y: 31, width: 8, height: 11 }
  },
  {
    svgId: 4,
    name: 'Snow Camo Hat',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [0, 1, 1, 0, 0, 0],

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
    dimensions: { x: 15, y: 2, width: 34, height: 20 }
  },
  {
    svgId: 5,
    name: 'Snow Camo Pants',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [0, 1, 1, 0, 0, 0],

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
    dimensions: { x: 15, y: 41, width: 34, height: 14 }
  },
  {
    svgId: 6,
    name: 'M67 Grenade',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [0, 2, 0, 0, 0, 0],

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
    dimensions: { x: 4, y: 31, width: 9, height: 11 }
  },
  {
    svgId: 7,
    name: 'Marine Cap',
    ghstPrice: 0,
    maxQuantity: 300,
    traitModifiers: [0, 2, 0, 1, 0, 0],

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
    dimensions: { x: 12, y: 1, width: 39, height: 27 }
  },
  {
    svgId: 8,
    name: 'Marine Jacket',
    ghstPrice: 0,
    maxQuantity: 300,
    traitModifiers: [0, 2, 0, 1, 0, 0],

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
    dimensions: { x: 12, y: 32, width: 40, height: 23 }
  },
  {
    svgId: 9,
    name: 'Walkie Talkie',
    ghstPrice: 0,
    maxQuantity: 300,
    traitModifiers: [1, 0, 1, 1, 0, 0],

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
    dimensions: { x: 3, y: 31, width: 7, height: 15 }
  },
  {
    svgId: 10,
    name: 'Link White Hat',
    ghstPrice: 0,
    maxQuantity: 150,
    traitModifiers: [0, 2, 0, 2, 0, 0],

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
    dimensions: { x: 9, y: 1, width: 46, height: 20 }
  },
  {
    svgId: 11,
    name: 'Link Mess Dress',
    ghstPrice: 0,
    maxQuantity: 150,
    traitModifiers: [0, 2, 0, 2, 0, 0],

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
    dimensions: { x: 12, y: 32, width: 40, height: 23 }
  },
  {
    svgId: 12,
    name: 'Link Bubbly',
    ghstPrice: 0,
    maxQuantity: 150,
    traitModifiers: [2, 0, 0, -2, 0, 0],

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
    dimensions: { x: 5, y: 25, width: 5, height: 19 }
  },
  {
    svgId: 13,
    name: 'Sergey Beard',
    ghstPrice: 0,
    maxQuantity: 50,
    traitModifiers: [-1, -1, 0, 3, 0, 0],

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
    dimensions: { x: 15, y: 6, width: 34, height: 34 }
  },
  {
    svgId: 14,
    name: 'Sergey Eyes',
    ghstPrice: 0,
    maxQuantity: 50,
    traitModifiers: [0, 0, 1, 4, 0, 0],

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
    dimensions: { x: 22, y: 22, width: 20, height: 8 }
  },
  {
    svgId: 15,
    name: 'Red Plaid',
    ghstPrice: 0,
    maxQuantity: 50,
    traitModifiers: [3, 2, 0, 0, 0, 0],

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
    dimensions: { x: 12, y: 33, width: 40, height: 23 }
  },
  {
    svgId: 16,
    name: 'Blue Plaid',
    ghstPrice: 0,
    maxQuantity: 5,
    traitModifiers: [-4, -2, 0, 0, 0, 0],

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
    dimensions: { x: 12, y: 33, width: 40, height: 23 }
  },
  {
    svgId: 17,
    name: 'Link Cube',
    ghstPrice: 0,
    maxQuantity: 5,
    traitModifiers: [0, 0, 0, 6, 0, 0],

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
    dimensions: { x: 1, y: 31, width: 12, height: 16 }
  },
  {
    svgId: 18,
    name: 'Aave Hero Mask',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [0, 0, 1, 0, 0, 0],

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
    dimensions: { x: 15, y: 19, width: 38, height: 13 }
  },
  {
    svgId: 19,
    name: 'Aave Hero Shirt',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [0, 0, 1, 0, 0, 0],

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
    dimensions: { x: 12, y: 32, width: 40, height: 19 }
  },
  {
    svgId: 20,
    name: 'Aave Plush',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [0, 0, 1, 0, 0, 0],

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
    dimensions: { x: 1, y: 32, width: 13, height: 13 }
  },
  {
    svgId: 21,
    name: 'Captain Aave Mask',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [1, 0, 1, 0, 0, 0],

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
    dimensions: { x: 11, y: 6, width: 42, height: 28 }
  },
  {
    svgId: 22,
    name: 'Captain Aave Suit',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [1, 0, 1, 0, 0, 0],

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
    dimensions: { x: 7, y: 34, width: 50, height: 24 }
  },
  {
    svgId: 23,
    name: 'Captain Aave Shield',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [2, 0, 0, 0, 0, 0],

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
    dimensions: { x: 3, y: 32, width: 20, height: 20 }
  },
  {
    svgId: 24,
    name: 'Thaave Helmet',
    ghstPrice: 0,
    maxQuantity: 250,
    traitModifiers: [2, 0, 1, 0, 0, 0],

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
    dimensions: { x: 9, y: 6, width: 46, height: 24 }
  },
  {
    svgId: 25,
    name: 'Thaave Suit',
    ghstPrice: 0,
    maxQuantity: 250,
    traitModifiers: [2, 0, 1, 0, 0, 0],

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
    dimensions: { x: 9, y: 33, width: 46, height: 22 }
  },
  {
    svgId: 26,
    name: 'Thaave Hammer',
    ghstPrice: 0,
    maxQuantity: 250,
    traitModifiers: [3, 0, 0, 1, 0, 0],

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
    dimensions: { x: 0, y: 28, width: 14, height: 14 }
  },
  {
    svgId: 27,
    name: 'Marc Hair',
    ghstPrice: 0,
    maxQuantity: 100,
    traitModifiers: [2, 2, 0, 0, 0, 0],

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
    dimensions: { x: 15, y: 6, width: 34, height: 20 }
  },
  {
    svgId: 28,
    name: 'Marc Outfit',
    ghstPrice: 0,
    maxQuantity: 100,
    traitModifiers: [2, 2, 0, 0, 0, 0],

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
    dimensions: { x: 12, y: 33, width: 40, height: 23 }
  },
  {
    svgId: 29,
    name: 'REKT Sign',
    ghstPrice: 0,
    maxQuantity: 100,
    traitModifiers: [0, 0, 0, -4, 0, 0],

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
    dimensions: { x: 0, y: 24, width: 17, height: 23 }
  },
  {
    svgId: 30,
    name: 'Jordan Hair',
    ghstPrice: 0,
    maxQuantity: 50,
    traitModifiers: [0, -2, 3, 0, 0, 0],

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
    dimensions: { x: 7, y: 0, width: 50, height: 34 }
  },
  {
    svgId: 31,
    name: 'Jordan Suit',
    ghstPrice: 0,
    maxQuantity: 50,
    traitModifiers: [-3, 0, 1, 1, 0, 0],

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
    dimensions: { x: 12, y: 33, width: 40, height: 23 }
  },
  {
    svgId: 32,
    name: 'Aave Flag',
    ghstPrice: 0,
    maxQuantity: 50,
    traitModifiers: [0, -2, 3, 0, 0, 0],

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
    dimensions: { x: 0, y: 24, width: 12, height: 25 }
  },
  {
    svgId: 33,
    name: 'Stani Hair',
    ghstPrice: 0,
    maxQuantity: 5,
    traitModifiers: [0, -3, 0, 3, 0, 0],

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
    dimensions: { x: 15, y: 6, width: 34, height: 18 }
  },
  {
    svgId: 34,
    name: 'Stani Vest',
    ghstPrice: 0,
    maxQuantity: 5,
    traitModifiers: [3, -3, 0, 0, 0, 0],

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
    dimensions: { x: 15, y: 33, width: 34, height: 16 }
  },
  {
    svgId: 35,
    name: 'Aave Boat',
    ghstPrice: 0,
    maxQuantity: 5,
    traitModifiers: [0, -6, 0, 0, 0, 0],

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
    dimensions: { x: 5, y: 46, width: 57, height: 15 }
  },

  // ETHEREUM RAFFLE

  {
    svgId: 36,
    name: 'ETH Logo Glasses',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [0, 0, 0, -1, 0, 0],

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
    dimensions: { x: 15, y: 19, width: 34, height: 13 }
  }, {
    svgId: 37,
    name: 'ETH T-Shirt',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [0, 0, 0, -1, 0, 0],

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
    dimensions: { x: 12, y: 32, width: 40, height: 19 }
  }, {
    svgId: 38,
    name: '32 ETH Coin',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [0, 0, 0, -1, 0, 0],

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
    dimensions: { x: 1, y: 31, width: 14, height: 14 }
  }, {
    svgId: 39,
    name: 'Foxy Mask',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [0, -2, 0, 0, 0, 0],

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
    dimensions: { x: 15, y: 2, width: 34, height: 40 }
  }, {
    svgId: 40,
    name: 'Foxy Tail',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [0, -1, -1, 0, 0, 0],

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
    dimensions: { x: 49, y: 22, width: 15, height: 28 }
  }, {
    svgId: 41,
    name: 'Trezor Wallet',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [-1, -1, 0, 0, 0, 0],

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
    dimensions: { x: 4, y: 31, width: 9, height: 14 }
  }, {
    svgId: 42,
    name: 'Eagle Mask',
    ghstPrice: 0,
    maxQuantity: 250,
    traitModifiers: [1, 0, 2, 0, 0, 0],

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
    dimensions: { x: 5, y: 6, width: 54, height: 27 }
  }, {
    svgId: 43,
    name: 'Eagle Armor',
    ghstPrice: 0,
    maxQuantity: 250,
    traitModifiers: [2, 0, 1, 0, 0, 0],

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
    dimensions: { x: 12, y: 33, width: 40, height: 23 }
  }, {
    svgId: 44,
    name: 'DAO Egg',
    ghstPrice: 0,
    maxQuantity: 250,
    traitModifiers: [1, 0, 0, 2, 0, 0],

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
    dimensions: { x: 0, y: 27, width: 16, height: 22 }
  }, {
    svgId: 45,
    name: 'Ape Mask',
    ghstPrice: 0,
    maxQuantity: 100,
    traitModifiers: [0, 1, 0, -3, 0, 0],

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
    dimensions: { x: 11, y: 6, width: 42, height: 35 }
  }, {
    svgId: 46,
    name: '#HalkRekt Shirt',
    ghstPrice: 0,
    maxQuantity: 100,
    traitModifiers: [1, 1, 0, -2, 0, 0],

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
    dimensions: { x: 12, y: 32, width: 40, height: 19 }
  }, {
    svgId: 47,
    name: 'Waifu Pillow',
    ghstPrice: 0,
    maxQuantity: 100,
    traitModifiers: [0, 0, 0, -4, 0, 0],

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
    dimensions: { x: 0, y: 23, width: 17, height: 30 }
  }, {
    svgId: 48,
    name: 'Xibot Mohawk',
    ghstPrice: 0,
    maxQuantity: 50,
    traitModifiers: [5, 0, 0, 0, 0, 0],

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
    dimensions: { x: 27, y: 0, width: 10, height: 22 }
  }, {
    svgId: 49,
    name: 'Coderdan Shades',
    ghstPrice: 0,
    maxQuantity: 50,
    traitModifiers: [0, 5, 0, 0, 0, 0],

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
    dimensions: { x: 15, y: 19, width: 34, height: 12 }
  }, {
    svgId: 50,
    name: 'GldnXross Robe',
    ghstPrice: 0,
    maxQuantity: 50,
    traitModifiers: [0, 0, 5, 0, 0, 0],

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
    dimensions: { x: 10, y: 33, width: 44, height: 24 }
  }, {
    svgId: 51,
    name: 'Mudgen Diamond',
    ghstPrice: 0,
    maxQuantity: 50,
    traitModifiers: [0, 0, 0, 5, 0, 0],

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
    dimensions: { x: 2, y: 33, width: 13, height: 10 }
  }, {
    svgId: 52,
    name: 'Galaxy Brain',
    ghstPrice: 0,
    maxQuantity: 5,
    traitModifiers: [0, 0, 0, 6, 0, 0],

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
    dimensions: { x: 11, y: 1, width: 42, height: 22 }
  }, {
    svgId: 53,
    name: 'All-Seeing Eyes',
    ghstPrice: 0,
    maxQuantity: 5,
    traitModifiers: [-6, 0, 0, 0, 0, 0],

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
    dimensions: { x: 18, y: 19, width: 28, height: 12 }
  }, {
    svgId: 54,
    name: 'Llamacorn Shirt',
    ghstPrice: 0,
    maxQuantity: 5,
    traitModifiers: [-3, -3, 0, 0, 0, 0],

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
    dimensions: { x: 12, y: 32, width: 40, height: 21 }
  },

  // For testing only

  {
    svgId: 55,
    name: 'Chemise Hawaienne Shirt',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [0, -6, 0, 0, 0, 0],

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
    svgId: 56,
    name: 'SantaGotchi Hat',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [2, 2, 0, 0, 0, 0],

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
    svgId: 57,
    name: 'Trait Potion',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [1, 1, 0, 0, 0, 0],

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
    svgId: 58,
    name: 'Experience Potion',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [],

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
    svgId: 59,
    name: 'Greater Kinship Potion',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [],

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
    svgId: 60,
    name: 'Collateral 8 Hat',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [2, 2, 0, 0, 0, 0],

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
    svgId: 61,
    name: 'Greater Trait Potion',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [2, 2, 0, 0, 0, 0],

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

function calculateRarityScoreModifier (maxQuantity) {
  if (maxQuantity >= 1000) return 1
  if (maxQuantity >= 500) return 2
  if (maxQuantity >= 250) return 5
  if (maxQuantity >= 100) return 10
  if (maxQuantity >= 10) return 20
  if (maxQuantity >= 1) return 50
  return 0
}

function getItemTypes () {
  const result = []
  for (const itemType of itemTypes) {
    itemType.traitModifiers = eightBitIntArrayToUint(itemType.traitModifiers)
    itemType.slotPositions = stringToSlotPositions(itemType.slotPositions)
    itemType.dimensions = dimensions(itemType.dimensions)
    itemType.rarityScoreModifier = calculateRarityScoreModifier(itemType.maxQuantity)
    // itemType.allowedCollaterals = sixteenBitArrayToUint(itemType.allowedCollaterals)
    result.push(itemType)
  }
  return result
}

exports.itemTypes = getItemTypes()
