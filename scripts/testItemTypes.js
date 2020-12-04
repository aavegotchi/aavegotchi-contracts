
/* global ethers */

const itemTypes = [

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
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0
  },

  {
    svgId: 1,
    name: 'Camo Hat',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [0, 1, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [true, true, true, false],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0
  },
  {
    svgId: 2,
    name: 'Camo Pants',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [0, 1, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [true, true, true, true, true, true, true, true, true, true],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 5,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0

  },
  {
    svgId: 3,
    name: 'MK2 Grenade',
    ghstPrice: 0,
    maxQuantity: 1000,
    traitModifiers: [0, 1, 0, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [true, true, true, true, true],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [8],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0
  },
  {
    svgId: 4,
    name: 'Snow Camo Hat',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [0, 1, 1, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [true],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0
  },
  {
    svgId: 5,
    name: 'Snow Camo Pants',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [0, 1, 1, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [true],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0
  },
  {
    svgId: 6,
    name: 'Snow Camo Pants',
    ghstPrice: 0,
    maxQuantity: 500,
    traitModifiers: [0, 1, 1, 0, 0, 0],
    rarityScoreModifier: 0,
    setId: 0,
    slotPositions: [true],
    canPurchaseWithGhst: true,
    totalQuantity: 0,
    allowedCollaterals: [],
    minLevel: 1,
    canBeTransferred: true,
    category: 0,
    kinshipBonus: 0
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
      uint.unshift('1')
    } else {
      uint.unshift('0')
    }
  }
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

function getItemTypes () {
  const result = []
  for (const itemType of itemTypes) {
    itemType.traitModifiers = eightBitIntArrayToUint(itemType.traitModifiers)
    // console.log(itemType.slotPositions)
    // console.log(slotPositionsToUint(itemType.slotPositions).toString())
    itemType.slotPositions = boolsArrayToUint16(itemType.slotPositions)
    itemType.allowedCollaterals = sixteenBitArrayToUint(itemType.allowedCollaterals)
    result.push(itemType)
  }
  return result
}

exports.itemTypes = getItemTypes()
