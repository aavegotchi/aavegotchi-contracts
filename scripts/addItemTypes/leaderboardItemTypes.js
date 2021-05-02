/* global ethers hre */
/* eslint-disable  prefer-const */

//const { LedgerSigner } = require('@ethersproject/hardware-wallets')


const itemTypes = [

  {

    name: "Rarity Farming SZN 1 Round 1 TOP 10 RARITY",
    description: "This Aavegotchi achieved a rank in the top 10 of RARITY for the very first round of the first ever season of Rarity Farming. \n\nThe first season of Rarity Farming featured three main leaderboards that any summoned Aavegotchi could participate in. All competing Aavegotchis were summoned from the original Haunt 1 portals of which there were 10,000 total.",
    svgId: 163,
    minLevel:0,
    canbeTransferred: false,
    totalQuantity: 0,
    maxQuantity: 10,
    setId: [],
    author: "xibot",
    dimensions: {x: 0, y:0, width:0, height:0 },
    allowedCollaterals: [],
    ghstPrice: 0,
    traitModifiers: [0,0,0,0,0,0],
    slotPositions: "none",
    category: 1,
    experienceBonus: 0,
    kinshipBonus: 0
  },
  {
  
    name: "Rarity Farming SZN 1 Round 1 TOP 100 RARITY",
    description: "This Aavegotchi achieved a rank in the top 100 of RARITY for the very first round of the first ever season of Rarity Farming. \n\nThe first season of Rarity Farming featured three main leaderboards that any summoned Aavegotchi could participate in. All competing Aavegotchis were summoned from the original Haunt 1 portals of which there were 10,000 total.",
    svgId: 164,
    canbeTransferred: false,
    totalQuantity: 0,
    minLevel:0,
    maxQuantity: 90,
    setId: [],
    author: "xibot",
    dimensions: {x: 0, y:0, width:0, height:0 },
    allowedCollaterals: [],
    ghstPrice: 0,
    traitModifiers: [0,0,0,0,0,0],
    slotPositions: "none",
    category: 1,
    experienceBonus: 0,
    kinshipBonus: 0
  },
 

   {
    name: "Rarity Farming SZN 1 Round 1 TOP 10 KINSHIP",
    description: "This Aavegotchi achieved a rank in the top 10 of RARITY for the very first round of the first ever season of Rarity Farming. \n\nThe first season of Rarity Farming featured three main leaderboards that any summoned Aavegotchi could participate in. All competing Aavegotchis were summoned from the original Haunt 1 portals of which there were 10,000 total.",
    svgId: 165,
    canbeTransferred: false,
    totalQuantity: 0,
    minLevel:0,
    maxQuantity: 10,
    setId: [],
    author: "xibot",
    dimensions: {x: 0, y:0, width:0, height:0 },
    allowedCollaterals: [],
    ghstPrice: 0,
    traitModifiers: [0,0,0,0,0,0],
    slotPositions: "none",
    category: 1,
    experienceBonus: 0,
    kinshipBonus: 0
  },
  {
    name: "Rarity Farming SZN 1 Round 1 TOP 100 KINSHIP",
    description: "This Aavegotchi achieved a rank in the top 100 of KINSHIP for the very first round of the first ever season of Rarity Farming. \n\nThe first season of Rarity Farming featured three main leaderboards that any summoned Aavegotchi could participate in. All competing Aavegotchis were summoned from the original Haunt 1 portals of which there were 10,000 total.",
    svgId: 166,
    minLevel:0,
    canbeTransferred: false,
    totalQuantity: 0,
    maxQuantity: 90,
    setId: [],
    author: "xibot",
    dimensions: {x: 0, y:0, width:0, height:0 },
    allowedCollaterals: [],
    ghstPrice: 0,
    traitModifiers: [0,0,0,0,0,0],
    slotPositions: "none",
    category: 1,
    experienceBonus: 0,
    kinshipBonus: 0
  },

  {
    name: "Rarity Farming SZN 1 Round 1 TOP 10 EXPERIENCE",
    description: "This Aavegotchi achieved a rank in the top 10 of EXPERIENCE for the very first round of the first ever season of Rarity Farming. \n\nThe first season of Rarity Farming featured three main leaderboards that any summoned Aavegotchi could participate in. All competing Aavegotchis were summoned from the original Haunt 1 portals of which there were 10,000 total.",
    svgId: 167,
    canbeTransferred: false,
    totalQuantity: 0,
    minLevel:0,
    maxQuantity: 10,
    setId: [],
    author: "xibot",
    dimensions: {x: 0, y:0, width:0, height:0 },
    allowedCollaterals: [],
    ghstPrice: 0,
    traitModifiers: [0,0,0,0,0,0],
    slotPositions: "none",
    category: 1,
    experienceBonus: 0,
    kinshipBonus: 0
  },

  {
   
    name: "Rarity Farming SZN 1 Round 1 TOP 100 EXPERIENCE",
    description: "This Aavegotchi achieved a rank in the top 100 of EXPERIENCE for the very first round of the first ever season of Rarity Farming. \n\nThe first season of Rarity Farming featured three main leaderboards that any summoned Aavegotchi could participate in. All competing Aavegotchis were summoned from the original Haunt 1 portals of which there were 10,000 total.",
    svgId: 168,
    canbeTransferred: false,
    totalQuantity: 0,
    minLevel:0,
    maxQuantity: 90,
    setId: [],
    author: "xibot",
    dimensions: {x: 0, y:0, width:0, height:0 },
    allowedCollaterals: [],
    ghstPrice: 0,
    traitModifiers: [0,0,0,0,0,0],
    slotPositions: "none",
    category: 1,
    experienceBonus: 0,
    kinshipBonus: 0
  },
 ]




function stringToSlotPositions (str) {
  if (str.length === 0) return [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
  // Slot 0 Body
  else if (str === 'body') return [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]

  // Slot 1 Face
  else if (str === 'face') return [false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false]

  // Slot 2 Eyes
  else if (str === 'eyes') return [false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false]

  // Slot 3 Head
  else if (str === 'head') return [false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false]

  // Slot 4/5 Either hand
  else if (str === 'hands') return [false, false, false, false, true, true, false, false, false, false, false, false, false, false, false, false]

  // Slot 4 Left hand
  else if (str === 'handLeft') return [false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false]

  // Slot 5 Right Hand
  else if (str === 'handRight') return [false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false]

  // Slot 6 Pet
  else if (str === 'pet') return [false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false]

  // Slot 7 Background
  else if (str === 'background') return [false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false]

  else if (str === 'none') return [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]

  else {
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
    itemType.ghstPrice = ethers.utils.parseEther(itemType.ghstPrice.toString())
    itemType.slotPositions = stringToSlotPositions(itemType.slotPositions)
    if (itemType.dimensions === '' || itemType.dimensions === 0) {
      itemType.dimensions = { x: 0, y: 0, width: 0, height: 0 }
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
