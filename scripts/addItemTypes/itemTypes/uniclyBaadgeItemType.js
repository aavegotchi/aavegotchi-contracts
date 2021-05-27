/* global ethers hre */
/* eslint-disable  prefer-const */

//const { LedgerSigner } = require('@ethersproject/hardware-wallets')


const itemTypes = [

  {

    name: "Unicly LP uGOTCHI/ETH Q2 2021",
    description: "The owner of this Aavegotchi provided liquidity to the NFT fractionalization platform Unicly for the uGOTCHI/ETH pair.\n This baadge was bestowed during May 2021 to each Aavegotchi in the owner's wallet at the time of snapshot. Unicly's liquidity mining program had been pushed back a few weeks and the least that could be done was to honor these early providers with a baadge.",
    svgId: 175,
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

exports.uniclyBaadgeItemType = getItemTypes()

