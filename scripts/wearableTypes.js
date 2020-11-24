
/* global ethers */
const WEARABLE_SLOT_HEAD = 0
const WEARABLE_SLOT_FACE = 1
const WEARABLE_SLOT_EYES = 2
const WEARABLE_SLOT_BODY = 3
const WEARABLE_SLOT_HEAD_BODY = 4
const WEARABLE_SLOT_HEAD_FACE = 5
const WEARABLE_SLOT_HEAD_FACE_EYES = 6
const WEARABLE_SLOT_HEAD_EYES = 7
const WEARABLE_SLOT_HAND_LEFT = 8
const WEARABLE_SLOT_HAND_RIGHT = 9
const WEARABLE_SLOT_HANDS_BOTH = 10
const WEARABLE_SLOT_PET = 11

const wearableTypes = [

  // Adding in a fake wearable to take up the "0" slot
  {
    traitModifiers: [0, 0, 0, 0, 0, 0],
    maxQuantity: 0,
    rarityScoreModifier: 0,
    setId: 0,
    slots: [0],
    svgId: 0,
    totalQuantity: 0,
    ghstPrice: 10,
    canPurchaseWithGhst: true
  },

  {
    // trait modifiers only applicable to first 4 digits
    traitModifiers: [-1, 0, 2, 1, 0, 0],
    maxQuantity: 2000,
    rarityScoreModifier: 20,
    setId: 0,
    slots: [2, 3],
    svgId: 1,
    totalQuantity: 0,
    ghstPrice: 10,
    canPurchaseWithGhst: true

  },
  {
    traitModifiers: [-1, 0, 2, 1, 0, 0],
    maxQuantity: 2000,
    rarityScoreModifier: 20,
    setId: 0,
    slots: [9],
    svgId: 2,
    totalQuantity: 0,
    ghstPrice: 10,
    canPurchaseWithGhst: true
  },
  {
    traitModifiers: [-1, 0, 2, 1, 0, 0],
    maxQuantity: 2000,
    rarityScoreModifier: 20,
    setId: 0,
    slots: [9],
    svgId: 2,
    totalQuantity: 0,
    ghstPrice: 10,
    canPurchaseWithGhst: true
  },
  {
    traitModifiers: [-1, 0, 2, 1, 0, 0],
    maxQuantity: 2000,
    rarityScoreModifier: 20,
    setId: 0,
    slots: [9],
    svgId: 2,
    totalQuantity: 0,
    ghstPrice: 10,
    canPurchaseWithGhst: true
  },
  {
    traitModifiers: [-1, 0, 2, 1, 0, 0],
    maxQuantity: 2000,
    rarityScoreModifier: 20,
    setId: 0,
    slots: [9],
    svgId: 2,
    totalQuantity: 0,
    ghstPrice: 10,
    canPurchaseWithGhst: true
  },
  {
    traitModifiers: [-1, 0, 2, 1, 0, 0],
    maxQuantity: 2000,
    rarityScoreModifier: 20,
    setId: 0,
    slots: [9],
    svgId: 2,
    totalQuantity: 0,
    ghstPrice: 10,
    canPurchaseWithGhst: true
  },
  {
    traitModifiers: [-1, 0, 2, 1, 0, 0],
    maxQuantity: 2000,
    rarityScoreModifier: 20,
    setId: 0,
    slots: [9],
    svgId: 2,
    totalQuantity: 0,
    ghstPrice: 10,
    canPurchaseWithGhst: true
  }


]

function eightBitArrayToUint(array) {
  const uint = []
  for (const num of array) {
    const value = ethers.BigNumber.from(num).toTwos(8)
    uint.unshift(value.toHexString().slice(2))
  }
  return ethers.BigNumber.from('0x' + uint.join(''))
}

function getWearableTypes() {
  const result = []
  for (const wearableType of wearableTypes) {
    wearableType.traitModifiers = eightBitArrayToUint(wearableType.traitModifiers)
    result.push(wearableType)
  }
  return result
}

exports.wearableTypes = getWearableTypes()
