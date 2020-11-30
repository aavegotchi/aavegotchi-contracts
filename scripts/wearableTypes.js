
/* global ethers */
const WEARABLE_SLOT_BODY = 0
const WEARABLE_SLOT_FACE = 1
const WEARABLE_SLOT_EYES = 2
const WEARABLE_SLOT_HEAD = 3
const WEARABLE_SLOT_HAND_LEFT = 4
const WEARABLE_SLOT_HAND_RIGHT = 5
const WEARABLE_SLOT_PET = 6
/*const WEARABLE_SLOT_HEAD_BODY = 4
const WEARABLE_SLOT_HEAD_FACE = 5
const WEARABLE_SLOT_HEAD_FACE_EYES = 6
const WEARABLE_SLOT_HEAD_EYES = 7
const WEARABLE_SLOT_FACE_EYES = 8*/

//const WEARABLE_SLOT_HANDS_BOTH = 11


const wearableTypes = [

  {
    svgId: 0,
    name: 'The Void',
    ghstPrice: 0,
    maxQuantity: 0,
    traitModifiers: [0, 0, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [],
    canPurchaseWithGhst: false,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1

  },

  {
    svgId: 1,
    name: 'Camo Hat',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [0, 1, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0, 3],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1

  },
  {
    svgId: 2,
    name: 'Camo Pants',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [0, 1, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0, 9],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1

  },
  {
    svgId: 3,
    name: 'MK2 Grenade',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [0, 1, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 4,
    name: 'Snow Camo Hat',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [0, 1, 1, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 5,
    name: 'Snow Camo Pants',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [0, 1, 1, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 6,
    name: 'M67 Grenade',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [0, 2, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 7,
    name: 'Marine Cap',
    ghstPrice: 0,
    maxQuantity: 300,
    traitModifiers: [0, 2, 0, 1, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 8,
    name: 'Marine Jacket',
    ghstPrice: 0,
    maxQuantity: 300,
    traitModifiers: [0, 2, 0, 1, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 9,
    name: 'Walkie Talkie',
    ghstPrice: 0,
    maxQuantity: 300,
    traitModifiers: [1, 0, 1, 1, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 10,
    name: 'Link White Hat',
    ghstPrice: 0,
    maxQuantity: 150,
    traitModifiers: [0, 2, 0, 2, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 11,
    name: 'Mess Dress',
    ghstPrice: 0,
    maxQuantity: 150,
    traitModifiers: [0, 2, 0, 2, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 12,
    name: 'Link Bubbly',
    ghstPrice: 0,
    maxQuantity: 150,
    traitModifiers: [2, 0, 0, -2, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 13,
    name: 'Sergey Beard',
    ghstPrice: 0,
    maxQuantity: 50,
    traitModifiers: [-1, -1, 0, 3, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 14,
    name: 'Sergey Eyes',
    ghstPrice: 0,
    maxQuantity: 50,
    traitModifiers: [0, 0, 1, 4, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 15,
    name: 'Red Plaid',
    ghstPrice: 0,
    maxQuantity: 50,
    traitModifiers: [3, 2, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 16,
    name: 'Blue Plaid',
    ghstPrice: 0,
    maxQuantity: 5,
    traitModifiers: [-4, -2, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 17,
    name: 'Link Cube',
    ghstPrice: 0,
    maxQuantity: 5,
    traitModifiers: [0, 0, 0, 6, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 18,
    name: 'Aave Hero Mask',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [0, 0, 1, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 19,
    name: 'Aave Hero Shirt',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [0, 0, 1, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 20,
    name: 'Aave Plush',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [0, 0, 1, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 21,
    name: 'Captain Aave Mask',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [1, 0, 1, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 22,
    name: 'Captain Aave Suit',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [1, 0, 1, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 23,
    name: 'Captain Aave Shield',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [2, 0, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 24,
    name: 'Thaave Helmet',
    ghstPrice: 0,
    maxQuantity: 250,
    traitModifiers: [2, 0, 1, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 25,
    name: 'Thaave Suit',
    ghstPrice: 0,
    maxQuantity: 250,
    traitModifiers: [2, 0, 1, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 26,
    name: 'Thaave Hammer',
    ghstPrice: 0,
    maxQuantity: 250,
    traitModifiers: [3, 0, 0, 1, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 27,
    name: 'Marc Hair',
    ghstPrice: 0,
    maxQuantity: 100,
    traitModifiers: [2, 2, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 28,
    name: 'Marc Outfit',
    ghstPrice: 0,
    maxQuantity: 100,
    traitModifiers: [2, 2, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 29,
    name: 'REKT Sign',
    ghstPrice: 0,
    maxQuantity: 100,
    traitModifiers: [0, 0, 0, -4, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 30,
    name: 'Jordan Hair',
    ghstPrice: 0,
    maxQuantity: 50,
    traitModifiers: [0, -2, 3, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 31,
    name: 'Jordan Suit',
    ghstPrice: 0,
    maxQuantity: 50,
    traitModifiers: [-3, 0, 1, 1, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 32,
    name: 'Aave Flag',
    ghstPrice: 0,
    maxQuantity: 50,
    traitModifiers: [0, -2, 3, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 33,
    name: 'Stani Hair',
    ghstPrice: 0,
    maxQuantity: 5,
    traitModifiers: [0, -3, 0, 3, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 34,
    name: 'Stani Vest',
    ghstPrice: 0,
    maxQuantity: 5,
    traitModifiers: [3, -3, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  },
  {
    svgId: 35,
    name: 'Aave Boat',
    ghstPrice: 0,
    maxQuantity: 5,
    traitModifiers: [0, -6, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [0],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1
  }
]

function eightBitIntArrayToUint(array) {
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

function eightBitUintArrayToUint(array) {
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

function getWearableTypes() {
  const result = []
  for (const wearableType of wearableTypes) {
    wearableType.traitModifiers = eightBitIntArrayToUint(wearableType.traitModifiers)
    // console.log(wearableType.slotPositions)
    // console.log(slotPositionsToUint(wearableType.slotPositions).toString())
    wearableType.slotPositions = eightBitUintArrayToUint(wearableType.slotPositions)
    wearableType.allowedCollaterals = 0
    result.push(wearableType)
  }
  return result
}

exports.wearableTypes = getWearableTypes()
