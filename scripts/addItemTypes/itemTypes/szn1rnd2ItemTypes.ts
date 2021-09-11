/* global ethers hre */
/* eslint-disable  prefer-const */

import { getItemTypes, ItemType } from "../../itemTypeHelpers";

//const { LedgerSigner } = require('@ethersproject/hardware-wallets')

const itemTypes: ItemType[] = [
  {
    name: "Rarity Farming SZN 1 Round 2 TOP 10 RARITY",
    description:
      "This Aavegotchi achieved a rank in the top 10 of RARITY for the second round of the first ever season of Rarity Farming. \n\nFrom April 20 to May 4, 2021, the first season of Rarity Farming featured three main leaderboards that any summoned Aavegotchi could participate in. All competing Aavegotchis were from the original Haunt 1 portals of which there were 10,000 total.",
    svgId: 169,
    minLevel: 0,
    canbeTransferred: false,
    totalQuantity: 0,
    maxQuantity: 10,
    setId: [],
    author: "xibot",
    dimensions: { x: 0, y: 0, width: 0, height: 0 },
    allowedCollaterals: [],
    ghstPrice: 0,
    traitModifiers: [0, 0, 0, 0, 0, 0],
    slotPositions: "none",
    category: 1,
    experienceBonus: 0,
    kinshipBonus: 0,
  },

  {
    name: "Rarity Farming SZN 1 Round 2 TOP 10 KINSHIP",
    description:
      "This Aavegotchi achieved a rank in the top 10 of RARITY for the second round of the first ever season of Rarity Farming. \n\nFrom April 20 to May 4, 2021, the first season of Rarity Farming featured three main leaderboards that any summoned Aavegotchi could participate in. All competing Aavegotchis were from the original Haunt 1 portals of which there were 10,000 total.",
    svgId: 170,
    canbeTransferred: false,
    totalQuantity: 0,
    minLevel: 0,
    maxQuantity: 10,
    setId: [],
    author: "xibot",
    dimensions: { x: 0, y: 0, width: 0, height: 0 },
    allowedCollaterals: [],
    ghstPrice: 0,
    traitModifiers: [0, 0, 0, 0, 0, 0],
    slotPositions: "none",
    category: 1,
    experienceBonus: 0,
    kinshipBonus: 0,
  },

  {
    name: "Rarity Farming SZN 1 Round 2 TOP 10 EXPERIENCE",
    description:
      "This Aavegotchi achieved a rank in the top 10 of EXPERIENCE for the second round of the first ever season of Rarity Farming. \n\nFrom April 20 to May 4, 2021, the first season of Rarity Farming featured three main leaderboards that any summoned Aavegotchi could participate in. All competing Aavegotchis were from the original Haunt 1 portals of which there were 10,000 total.",
    svgId: 171,
    canbeTransferred: false,
    totalQuantity: 0,
    minLevel: 0,
    maxQuantity: 10,
    setId: [],
    author: "xibot",
    dimensions: { x: 0, y: 0, width: 0, height: 0 },
    allowedCollaterals: [],
    ghstPrice: 0,
    traitModifiers: [0, 0, 0, 0, 0, 0],
    slotPositions: "none",
    category: 1,
    experienceBonus: 0,
    kinshipBonus: 0,
  },

  {
    name: "Rarity Farming SZN 1 Round 2 TOP 100 RARITY",
    description:
      "This Aavegotchi achieved a rank in the top 100 of RARITY for the second round of the first ever season of Rarity Farming. \n\nFrom April 20 to May 4, 2021, the first season of Rarity Farming featured three main leaderboards that any summoned Aavegotchi could participate in. All competing Aavegotchis were from the original Haunt 1 portals of which there were 10,000 total.",
    svgId: 172,
    canbeTransferred: false,
    totalQuantity: 0,
    minLevel: 0,
    maxQuantity: 90,
    setId: [],
    author: "xibot",
    dimensions: { x: 0, y: 0, width: 0, height: 0 },
    allowedCollaterals: [],
    ghstPrice: 0,
    traitModifiers: [0, 0, 0, 0, 0, 0],
    slotPositions: "none",
    category: 1,
    experienceBonus: 0,
    kinshipBonus: 0,
  },

  {
    name: "Rarity Farming SZN 1 Round 2 TOP 100 KINSHIP",
    description:
      "This Aavegotchi achieved a rank in the top 100 of KINSHIP for the second round of the first ever season of Rarity Farming. \n\nFrom April 20 to May 4, 2021, the first season of Rarity Farming featured three main leaderboards that any summoned Aavegotchi could participate in. All competing Aavegotchis were from the original Haunt 1 portals of which there were 10,000 total.",
    svgId: 173,
    minLevel: 0,
    canbeTransferred: false,
    totalQuantity: 0,
    maxQuantity: 90,
    setId: [],
    author: "xibot",
    dimensions: { x: 0, y: 0, width: 0, height: 0 },
    allowedCollaterals: [],
    ghstPrice: 0,
    traitModifiers: [0, 0, 0, 0, 0, 0],
    slotPositions: "none",
    category: 1,
    experienceBonus: 0,
    kinshipBonus: 0,
  },

  {
    name: "Rarity Farming SZN 1 Round 2 TOP 100 EXPERIENCE",
    description:
      "This Aavegotchi achieved a rank in the top 100 of EXPERIENCE for the second round of the first ever season of Rarity Farming. \n\nFrom April 20 to May 4, 2021, the first season of Rarity Farming featured three main leaderboards that any summoned Aavegotchi could participate in. All competing Aavegotchis were from the original Haunt 1 portals of which there were 10,000 total.",
    svgId: 174,
    canbeTransferred: false,
    totalQuantity: 0,
    minLevel: 0,
    maxQuantity: 90,
    setId: [],
    author: "xibot",
    dimensions: { x: 0, y: 0, width: 0, height: 0 },
    allowedCollaterals: [],
    ghstPrice: 0,
    traitModifiers: [0, 0, 0, 0, 0, 0],
    slotPositions: "none",
    category: 1,
    experienceBonus: 0,
    kinshipBonus: 0,
  },
];

exports.szn1rnd2ItemTypes = getItemTypes(itemTypes);
