const { isThrowStatement } = require('typescript')

/* global ethers */
const WEARABLE_SLOT_BODY = 0
const WEARABLE_SLOT_FACE = 1
const WEARABLE_SLOT_EYES = 2
const WEARABLE_SLOT_HEAD = 3
const WEARABLE_SLOT_HAND_LEFT = 4
const WEARABLE_SLOT_HAND_RIGHT = 5
const WEARABLE_SLOT_PET_FRONT = 6
const WEARABLE_SLOT_PET_BACK = 7
const WEARABLE_SLOT_BG = 8

const itemTypes = [
  {
    svgId: 0,
    name: 'The Void',
    setId: [],
    author: 'Xibot',
    description: 'The Void',
    dimensions: '',
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    allowedCollaterals: [],
    minLevel: 1,
    ghstPrice: 0,
    maxQuantity: 0,
    traitModifiers: [0, 0, 0, 0, 0, 0],
    canPurchaseWithGhst: false,
    slotPositions: '',
    category: 0,
    canBeTransferred: false,
    totalQuantity: 0,
    experienceBonus: 0,
    kinshipBonus: 0
  },
  {
    svgId: 1,
    name: 'Camo Hat',
    setId: [1],
    author: 'Xibot',
    description: '',
    dimensions: { x: 15, y: 2, width: 34, height: 20 },
    x: 15,
    y: 2,
    width: 34,
    height: 20,
    allowedCollaterals: [],
    minLevel: 1,
    ghstPrice: 5,
    maxQuantity: '1000',
    traitModifiers: [0, 1, 0, 0, 0, 0],
    canPurchaseWithGhst: false,
    slotPositions: 'head',
    category: 0,
    canBeTransferred: true,
    totalQuantity: 0,
    experienceBonus: 0,
    kinshipBonus: 0
  },
  {
    svgId: 2,
    name: 'Camo Pants',
    setId: [1],
    author: 'Xibot',
    description: '',
    dimensions: { x: 15, y: 41, width: 34, height: 14 },
    x: 15,
    y: 41,
    width: 34,
    height: 14,
    allowedCollaterals: [],
    minLevel: 1,
    ghstPrice: 5,
    maxQuantity: '1000',
    traitModifiers: [0, 1, 0, 0, 0, 0],
    canPurchaseWithGhst: false,
    slotPositions: 'body',
    category: 0,
    canBeTransferred: true,
    totalQuantity: 0,
    experienceBonus: 0,
    kinshipBonus: 0
  },
  {
    svgId: 3,
    name: 'MK2 Grenade',
    setId: [1],
    author: 'Xibot',
    description: '',
    dimensions: { x: 5, y: 31, width: 8, height: 11 },
    x: 5,
    y: 31,
    width: 8,
    height: 11,
    allowedCollaterals: [],
    minLevel: 1,
    ghstPrice: 5,
    maxQuantity: '1000',
    traitModifiers: [0, 1, 0, 0, 0, 0],
    canPurchaseWithGhst: false,
    slotPositions: 'hands',
    category: 0,
    canBeTransferred: true,
    totalQuantity: 0,
    experienceBonus: 0,
    kinshipBonus: 0
  },
  {
    svgId: 4,
    name: 'Greater XP Potion',
    setId: [],
    author: 'Xibot',
    description: '+50 to XP',
    dimensions: '',
    x: null,
    y: null,
    width: null,
    height: null,
    allowedCollaterals: [],
    minLevel: 1,
    ghstPrice: 50,
    maxQuantity: '250',
    traitModifiers: [0, 0, 0, 0, 0, 0],
    canPurchaseWithGhst: true,
    slotPositions: '',
    category: 2,
    canBeTransferred: true,
    totalQuantity: 0,
    experienceBonus: 50,
    kinshipBonus: 0
  }
]

function eightBitIntArrayToUint(array) {
  if (array.length === 0) {
    return ethers.BigNumber.from(0)
  }
  const uint = []
  for (const num of array) {
    if (num > 127) {
      throw (Error('Value beyond signed 8 int '))
    }
    const value = ethers.BigNumber.from(num).toTwos(8)
    uint.unshift(value.toHexString().slice(2))
  }
  return ethers.BigNumber.from('0x' + uint.join(''))
}

function boolsArrayToUint16(bools) {
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

function dimensions({ x, y, width, height }) {
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

function stringToSlotPositions(str) {
  if (str.length === 0) {
    return 0
  }
  //Slot 0 Body
  else if (str === 'body') return boolsArrayToUint16([true])

  //Slot 1 Face
  else if (str === 'face') return boolsArrayToUint16([true, false])

  //Slot 2 Eyes
  else if (str === 'eyes') return boolsArrayToUint16([true, false, false])

  //Slot 3 Head
  else if (str === 'head') return boolsArrayToUint16([true, false, false, false])

  //Slot 4/5 Either hand
  else if (str === 'hands') return boolsArrayToUint16([true, true, false, false, false, false])

  //Slot 4 Left hand
  else if (str === 'handLeft') return boolsArrayToUint16([true, false, false, false, false])

  //Slot 5 Right Hand
  else if (str === 'handRight') return boolsArrayToUint16([true, false, false, false, false, false])

  //Slot 6 Pet
  else if (str === 'pet') return boolsArrayToUint16([true, false, false, false, false, false, false])

  //Slot 7 Background
  else if (str === 'background') return boolsArrayToUint16([true, false, false, false, false, false, false, false])

  else {
    throw (Error('Wrong slot string: ' + str))
  }
}

function calculateRarityScoreModifier(maxQuantity) {
  if (maxQuantity >= 1000) return 1
  if (maxQuantity >= 500) return 2
  if (maxQuantity >= 250) return 5
  if (maxQuantity >= 100) return 10
  if (maxQuantity >= 10) return 20
  if (maxQuantity >= 1) return 50
  return 0
}

function getItemTypes() {
  const result = []
  for (const itemType of itemTypes) {
    itemType.ghstPrice = ethers.utils.parseEther(itemType.ghstPrice.toString())
    itemType.traitModifiers = eightBitIntArrayToUint(itemType.traitModifiers)
    itemType.slotPositions = stringToSlotPositions(itemType.slotPositions)
    if (itemType.dimensions === '' || itemType.dimensions === 0) {
      itemType.dimensions = 0
    } else {
      itemType.dimensions = dimensions(itemType.dimensions)
    }

    itemType.rarityScoreModifier = calculateRarityScoreModifier(itemType.maxQuantity)
    if (!Array.isArray(itemType.allowedCollaterals)) {
      throw Error('Is not array.')
    }
    result.push(itemType)
  }
  return result
}

exports.itemTypes = getItemTypes()
