/* global ethers */

// Rarity bonus
// nrg
// agg
// spk
// brn

const wearableSetArrays = [
  {
    name: 'Infantry',
    wearableIds: [1, 2, 3],
    traitsBonuses: [1, 0, 1, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Trooper',
    wearableIds: [4, 5, 6],
    traitsBonuses: [2, 0, 1, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Sergeant',
    wearableIds: [7, 8, 9],
    traitsBonuses: [3, 0, 2, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'General',
    wearableIds: [10, 11, 12],
    traitsBonuses: [4, 0, 2, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Mythical Sergey',
    wearableIds: [13, 14, 15],
    traitsBonuses: [5, 0, 3, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Godlike Sergey',
    wearableIds: [13, 14, 16],
    traitsBonuses: [6, 0, 3, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Apex Sergey',
    wearableIds: [13, 14, 16, 17],
    traitsBonuses: [6, 1, 3, 0, 0],
    allowedCollaterals: [3]
  },
  {
    name: 'Aave Hero',
    wearableIds: [18, 19, 20],
    traitsBonuses: [1, 0, 0, 1, 0],
    allowedCollaterals: []
  },
  {
    name: 'Captain Aave',
    wearableIds: [21, 22, 23],
    traitsBonuses: [2, 0, 0, 1, 0],
    allowedCollaterals: []
  },
  {
    name: 'Thaave',
    wearableIds: [24, 25, 26],
    traitsBonuses: [3, 2, 0, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Marc',
    wearableIds: [27, 28, 29],
    traitsBonuses: [4, 2, 0, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Jordan',
    wearableIds: [30, 31, 32],
    traitsBonuses: [5, 0, 0, 3, 0],
    allowedCollaterals: []
  },
  {
    name: 'Godlike Stani',
    wearableIds: [33, 34, 35],
    traitsBonuses: [6, 0, -3, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Apex Stani',
    wearableIds: [32, 33, 34, 35],
    traitsBonuses: [6, 1, -3, 0, 0],
    allowedCollaterals: [2]
  },
  {
    name: 'ETH Maxi',
    wearableIds: [36, 37, 38],
    traitsBonuses: [1, 0, 0, 0, -1],
    allowedCollaterals: []
  },
  {
    name: 'Foxy Meta',
    wearableIds: [39, 40, 41],
    traitsBonuses: [2, 0, -1, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Nogara the Eagle',
    wearableIds: [42, 43, 44],
    traitsBonuses: [3, 2, 0, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'DeFi Degen',
    wearableIds: [45, 46, 47],
    traitsBonuses: [4, 0, 0, 0, -2],
    allowedCollaterals: []
  },
  {
    name: 'DAO Summoner',
    wearableIds: [48, 49, 50, 51],
    traitsBonuses: [5, 0, 0, 0, 3],
    allowedCollaterals: []
  },
  {
    name: 'Vitalik Visionary',
    wearableIds: [52, 53, 54],
    traitsBonuses: [6, -3, 0, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Apex Vitalik Visionary',
    wearableIds: [51, 52, 53, 54],
    traitsBonuses: [7, -3, 0, 0, 1],
    allowedCollaterals: [1]
  },
  {
    name: 'Super Aagent',
    wearableIds: [55, 56, 57, 58, 59],
    traitsBonuses: [4, -1, 0, 2, 0],
    allowedCollaterals: []
  },
  {
    name: 'Aagent ',
    wearableIds: [55, 56, 57],
    traitsBonuses: [3, -1, 0, 1, 0],
    allowedCollaterals: []
  },
  {
    name: 'Aagent ',
    wearableIds: [55, 56, 57, 58],
    traitsBonuses: [3, -1, 0, 2, 0],
    allowedCollaterals: []
  },
  {
    name: 'Wizard ',
    wearableIds: [60, 64, 66],
    traitsBonuses: [1, 1, 0, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Wizard',
    wearableIds: [61, 64, 66],
    traitsBonuses: [1, 1, 0, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Wizard',
    wearableIds: [62, 64, 66],
    traitsBonuses: [1, 1, 0, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Wizard',
    wearableIds: [63, 64, 66],
    traitsBonuses: [1, 1, 0, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Wizard',
    wearableIds: [60, 65, 66],
    traitsBonuses: [1, 1, 0, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Legendary Wizard',
    wearableIds: [61, 65, 66],
    traitsBonuses: [4, 1, 0, 0, 1],
    allowedCollaterals: []
  },
  {
    name: 'Mythical Wizard',
    wearableIds: [62, 65, 66],
    traitsBonuses: [5, 1, 0, 0, 2],
    allowedCollaterals: []
  },
  {
    name: 'Godlike Wizard',
    wearableIds: [63, 65, 66],
    traitsBonuses: [6, 1, 0, 0, 2],
    allowedCollaterals: []
  },
  {
    name: 'Farmer',
    wearableIds: [67, 68, 69],
    traitsBonuses: [1, -1, 0, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Mythical Farmer',
    wearableIds: [67, 68, 70],
    traitsBonuses: [5, -2, 0, 0, -1],
    allowedCollaterals: []
  },
  {
    name: 'OKex Jaay',
    wearableIds: [72, 73, 74],
    traitsBonuses: [5, -1, 0, 0, -2],
    allowedCollaterals: []
  },
  {
    name: 'OKex Jaay Hao',
    wearableIds: [72, 73, 74, 75],
    traitsBonuses: [5, -1, 0, 0, -2],
    allowedCollaterals: []
  },
  {
    name: 'Skater',
    wearableIds: [77, 78, 79],
    traitsBonuses: [2, 0, 0, 0, -1],
    allowedCollaterals: []
  },
  {
    name: 'Sushi Chef',
    wearableIds: [80, 81, 82],
    traitsBonuses: [3, 0, 2, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Sushi Chef',
    wearableIds: [80, 81, 83],
    traitsBonuses: [4, 0, 2, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Master Sushi Chef',
    wearableIds: [80, 81, 82, 83],
    traitsBonuses: [4, 0, 2, -1, 0],
    allowedCollaterals: []
  },
  {
    name: 'Gentleman',
    wearableIds: [84, 85, 86],
    traitsBonuses: [4, 0, -2, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Miner',
    wearableIds: [87, 88, 89],
    traitsBonuses: [2, 1, 0, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Pajamas',
    wearableIds: [90, 91, 92],
    traitsBonuses: [3, 0, 0, -2, 0],
    allowedCollaterals: []
  },
  {
    name: 'Pajamas',
    wearableIds: [90, 91, 93],
    traitsBonuses: [3, 0, 0, -2, 0],
    allowedCollaterals: []
  },
  {
    name: 'Full Pajamas',
    wearableIds: [90, 91, 92, 93],
    traitsBonuses: [4, 0, 0, -3, 0],
    allowedCollaterals: []
  },
  {
    name: 'Runner',
    wearableIds: [94, 95, 96],
    traitsBonuses: [2, 1, 0, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Runner',
    wearableIds: [94, 95, 121],
    traitsBonuses: [2, 1, 0, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Runner',
    wearableIds: [94, 125, 96],
    traitsBonuses: [2, 1, 0, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Long Distance Runner',
    wearableIds: [94, 125, 121],
    traitsBonuses: [4, 2, 0, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Lady',
    wearableIds: [97, 98, 100],
    traitsBonuses: [4, 0, 0, -2, 0],
    allowedCollaterals: []
  },
  {
    name: 'Lady',
    wearableIds: [97, 98, 99],
    traitsBonuses: [4, 0, 0, -2, 0],
    allowedCollaterals: []
  },
  {
    name: 'Socialite',
    wearableIds: [97, 98, 99, 100],
    traitsBonuses: [5, 2, 0, -1, 0],
    allowedCollaterals: []
  },
  {
    name: 'Witchy',
    wearableIds: [101, 102, 103],
    traitsBonuses: [5, 0, 0, 3, 0],
    allowedCollaterals: []
  },
  {
    name: 'Portal Mage',
    wearableIds: [104, 105, 106],
    traitsBonuses: [4, 0, 2, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Supreme Portal Mage',
    wearableIds: [104, 105, 107],
    traitsBonuses: [6, 0, 3, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Rastafarian',
    wearableIds: [108, 109, 110],
    traitsBonuses: [3, 0, -2, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Off Duty Hazmat',
    wearableIds: [111, 112, 123],
    traitsBonuses: [4, 2, 0, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'On Duty Hazmat',
    wearableIds: [111, 112, 113],
    traitsBonuses: [6, 3, 0, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Blue Vacationer',
    wearableIds: [115, 116, 117],
    traitsBonuses: [4, -2, 0, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Red Vacationer',
    wearableIds: [114, 116, 117],
    traitsBonuses: [5, -2, 0, -1, 0],
    allowedCollaterals: []
  },
  {
    name: 'Crypto OG',
    wearableIds: [12, 19, 36, 40, 77],
    traitsBonuses: [4, 0, 0, 0, -2],
    allowedCollaterals: []
  },
  {
    name: 'Rektboi',
    wearableIds: [29, 45, 46],
    traitsBonuses: [4, 0, 0, 0, -2],
    allowedCollaterals: []
  },
  {
    name: 'Man of Culture',
    wearableIds: [47, 59, 74],
    traitsBonuses: [4, 0, 0, 0, -2],
    allowedCollaterals: []
  },
  {
    name: 'Curve Surfer',
    wearableIds: [66, 76, 115],
    traitsBonuses: [4, 0, 0, 0, 2],
    allowedCollaterals: []
  },
  {
    name: 'PoW Miner',
    wearableIds: [25, 77, 89],
    traitsBonuses: [3, 0, 2, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Toddler',
    wearableIds: [90, 91, 119],
    traitsBonuses: [4, 0, -2, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'FU Money',
    wearableIds: [35, 114, 117, 120],
    traitsBonuses: [6, 0, -3, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Farmer Alf',
    wearableIds: [13, 67, 68, 69],
    traitsBonuses: [5, -3, 0, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Battle Santa',
    wearableIds: [5, 13, 71, 106],
    traitsBonuses: [5, 0, 3, 0, 0],
    allowedCollaterals: []
  },
  {
    name: 'Party Animal',
    wearableIds: [109, 40, 124],
    traitsBonuses: [5, 0, 0, 0, -3],
    allowedCollaterals: []
  }

]

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

function eightBitIntArrayToUint (array) {
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

const wearableSets = []
for (const wearableSet of wearableSetArrays) {
  if (!Array.isArray(wearableSet.allowedCollaterals)) {
    console.log(wearableSet)
    throw (Error('Is not array'))
  }
  wearableSets.push(
    {
      name: wearableSet.name,
      wearableIds: sixteenBitArrayToUint(wearableSet.wearableIds),
      traitsBonuses: eightBitIntArrayToUint(wearableSet.traitsBonuses),
      allowedCollaterals: wearableSet.allowedCollaterals
    }
  )
}

exports.wearableSets = wearableSets
