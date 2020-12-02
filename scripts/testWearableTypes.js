
/* global ethers */

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
        slotPositions: [0, 1],
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
