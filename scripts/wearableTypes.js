
const WEARABLE_SLOT_HEAD = 0
const WEARABLE_SLOT_FACE = 1
const WEARABLE_SLOT_EYES = 2
const WEARABLE_SLOT_BODY = 3
const WEARABLE_SLOT_HAND_LEFT = 4
const WEARABLE_SLOT_HAND_RIGHT = 5
const WEARABLE_SLOT_HANDS_BOTH = 6
const WEARABLE_SLOT_PET = 7

const wearableTypes = [

  //Adding in a fake wearable to take up the "0" slot
  {
    traitModifiers: [0, 0, 0, 0, 0, 0],
    maxQuantity: 0,
    rarityScoreModifier: 0,
    setId: 0,
    slots: [0],
    svgId: 0,
    totalQuantity: 0,
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
  },
  {
    traitModifiers: [-1, 0, 2, 1, 0, 0],
    maxQuantity: 2000,
    rarityScoreModifier: 20,
    setId: 0,
    slots: [3],
    svgId: 2,
    totalQuantity: 0,
  }

]

exports.wearableTypes = wearableTypes
