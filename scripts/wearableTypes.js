
const WEARABLE_SLOT_HEAD = 0
const WEARABLE_SLOT_FACE = 1
const WEARABLE_SLOT_EYES = 2
const WEARABLE_SLOT_BODY = 3
const WEARABLE_SLOT_HAND_LEFT = 4
const WEARABLE_SLOT_HAND_RIGHT = 5
const WEARABLE_SLOT_HANDS_BOTH = 6
const WEARABLE_SLOT_PET = 7

const wearableTypes = [
  {
    // trait modifiers only applicable to first 4 digits
    traitModifiers: [-1, 0, 2, 1, 0, 0],
    maxQuantity: 2000,
    rarityScoreModifier: 20,
    setId: 0,
    slots: [WEARABLE_SLOT_BODY],
    svgId: 1
  },
  {
    traitModifiers: [-1, 0, 2, 1, 0, 0],
    maxQuantity: 2000,
    rarityScoreModifier: 20,
    setId: 0,
    slots: [WEARABLE_SLOT_BODY],
    svgId: 1
  }

]

exports.wearableTypes = wearableTypes
