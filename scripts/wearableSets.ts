/* global ethers */

// Rarity bonus
// nrg
// agg
// spk
// brn
import { BigNumber } from "@ethersproject/bignumber";
/* global ethers */

// Rarity bonus
// nrg
// agg
// spk
// brn

export const wearableSetArrays = [
  {
    name: "Infantry",
    wearableIds: [1, 2, 3],
    traitsBonuses: [1, 0, 1, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Trooper",
    wearableIds: [4, 5, 6],
    traitsBonuses: [2, 0, 1, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Sergeant",
    wearableIds: [7, 8, 9],
    traitsBonuses: [3, 0, 2, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "General",
    wearableIds: [10, 11, 12],
    traitsBonuses: [4, 0, 2, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Mythical Sergey",
    wearableIds: [13, 14, 15],
    traitsBonuses: [5, 0, 3, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Godlike Sergey",
    wearableIds: [13, 14, 16],
    traitsBonuses: [6, -3, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Apex Sergey",
    wearableIds: [13, 14, 16, 17],
    traitsBonuses: [6, -4, 0, 0, 0],
    allowedCollaterals: [3],
  },
  {
    name: "Aave Hero",
    wearableIds: [18, 19, 20],
    traitsBonuses: [1, 0, 0, 1, 0],
    allowedCollaterals: [],
  },
  {
    name: "Captain Aave",
    wearableIds: [21, 22, 23],
    traitsBonuses: [2, 0, 0, 1, 0],
    allowedCollaterals: [],
  },
  {
    name: "Thaave",
    wearableIds: [24, 25, 26],
    traitsBonuses: [3, 2, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Marc",
    wearableIds: [27, 28, 29],
    traitsBonuses: [4, 2, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Jordan",
    wearableIds: [30, 31, 32],
    traitsBonuses: [5, 0, 0, 3, 0],
    allowedCollaterals: [],
  },
  {
    name: "Godlike Stani",
    wearableIds: [33, 34, 35],
    traitsBonuses: [6, 0, -3, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Apex Stani",
    wearableIds: [32, 33, 34, 35],
    traitsBonuses: [6, 1, -3, 0, 0],
    allowedCollaterals: [2],
  },
  {
    name: "ETH Maxi",
    wearableIds: [36, 37, 38],
    traitsBonuses: [1, 0, 0, 0, -1],
    allowedCollaterals: [],
  },
  {
    name: "Foxy Meta",
    wearableIds: [39, 40, 41],
    traitsBonuses: [2, 0, -1, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Nogara the Eagle",
    wearableIds: [42, 43, 44],
    traitsBonuses: [3, 2, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "DeFi Degen",
    wearableIds: [45, 46, 47],
    traitsBonuses: [4, 0, 0, 0, -2],
    allowedCollaterals: [],
  },
  {
    name: "DAO Summoner",
    wearableIds: [48, 49, 50, 51],
    traitsBonuses: [5, 0, 0, 0, 3],
    allowedCollaterals: [],
  },
  {
    name: "Vitalik Visionary",
    wearableIds: [52, 53, 54],
    traitsBonuses: [6, -3, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Apex Vitalik Visionary",
    wearableIds: [51, 52, 53, 54],
    traitsBonuses: [7, -3, 0, 0, 1],
    allowedCollaterals: [1],
  },
  {
    name: "Super Aagent",
    wearableIds: [55, 56, 57, 58, 59],
    traitsBonuses: [4, -1, 0, 2, 0],
    allowedCollaterals: [],
  },
  {
    name: "Aagent ",
    wearableIds: [55, 56, 57],
    traitsBonuses: [3, -1, 0, 1, 0],
    allowedCollaterals: [],
  },
  {
    name: "Aagent ",
    wearableIds: [55, 56, 57, 58],
    traitsBonuses: [3, -1, 0, 2, 0],
    allowedCollaterals: [],
  },
  {
    name: "Wizard ",
    wearableIds: [60, 64, 66],
    traitsBonuses: [1, 1, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Wizard",
    wearableIds: [61, 64, 66],
    traitsBonuses: [1, 1, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Wizard",
    wearableIds: [62, 64, 66],
    traitsBonuses: [1, 1, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Wizard",
    wearableIds: [63, 64, 66],
    traitsBonuses: [1, 1, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Wizard",
    wearableIds: [60, 65, 66],
    traitsBonuses: [1, 1, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Legendary Wizard",
    wearableIds: [61, 65, 66],
    traitsBonuses: [4, 1, 0, 0, 1],
    allowedCollaterals: [],
  },
  {
    name: "Mythical Wizard",
    wearableIds: [62, 65, 66],
    traitsBonuses: [5, 1, 0, 0, 2],
    allowedCollaterals: [],
  },
  {
    name: "Godlike Wizard",
    wearableIds: [63, 65, 66],
    traitsBonuses: [6, 1, 0, 0, 2],
    allowedCollaterals: [],
  },
  {
    name: "Farmer",
    wearableIds: [67, 68, 69],
    traitsBonuses: [1, -1, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Mythical Farmer",
    wearableIds: [67, 68, 70],
    traitsBonuses: [5, -2, 0, 0, -1],
    allowedCollaterals: [],
  },
  {
    name: "OKex Jaay",
    wearableIds: [72, 73, 74],
    traitsBonuses: [5, -1, 0, 0, -2],
    allowedCollaterals: [],
  },
  {
    name: "OKex Jaay Hao",
    wearableIds: [72, 73, 74, 75],
    traitsBonuses: [5, -1, 0, 0, -2],
    allowedCollaterals: [],
  },
  {
    name: "Skater",
    wearableIds: [77, 78, 79],
    traitsBonuses: [2, 0, 0, 0, -1],
    allowedCollaterals: [],
  },
  {
    name: "Sushi Chef",
    wearableIds: [80, 81, 82],
    traitsBonuses: [4, 0, 2, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Sushi Chef",
    wearableIds: [80, 81, 83],
    traitsBonuses: [3, 0, 2, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Master Sushi Chef",
    wearableIds: [80, 81, 82, 83],
    traitsBonuses: [4, 0, 2, -1, 0],
    allowedCollaterals: [],
  },
  {
    name: "Gentleman",
    wearableIds: [84, 85, 86],
    traitsBonuses: [4, 0, -2, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Miner",
    wearableIds: [87, 88, 89],
    traitsBonuses: [2, 1, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Pajamas",
    wearableIds: [90, 91, 92],
    traitsBonuses: [3, 0, 0, -2, 0],
    allowedCollaterals: [],
  },
  {
    name: "Pajamas",
    wearableIds: [90, 91, 93],
    traitsBonuses: [3, 0, 0, -2, 0],
    allowedCollaterals: [],
  },
  {
    name: "Full Pajamas",
    wearableIds: [90, 91, 92, 93],
    traitsBonuses: [4, 0, 0, -3, 0],
    allowedCollaterals: [],
  },
  {
    name: "Runner",
    wearableIds: [94, 95, 96],
    traitsBonuses: [2, 1, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Runner",
    wearableIds: [94, 95, 118],
    traitsBonuses: [2, 1, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Runner",
    wearableIds: [94, 125, 96],
    traitsBonuses: [2, 1, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Long Distance Runner",
    wearableIds: [94, 125, 118],
    traitsBonuses: [4, 2, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Lady",
    wearableIds: [97, 98, 100],
    traitsBonuses: [4, 0, 0, -2, 0],
    allowedCollaterals: [],
  },
  {
    name: "Lady",
    wearableIds: [97, 98, 99],
    traitsBonuses: [4, 0, 0, -2, 0],
    allowedCollaterals: [],
  },
  {
    name: "Socialite",
    wearableIds: [97, 98, 99, 100],
    traitsBonuses: [5, 2, 0, -1, 0],
    allowedCollaterals: [],
  },
  {
    name: "Witchy",
    wearableIds: [101, 102, 103],
    traitsBonuses: [5, 0, 0, 3, 0],
    allowedCollaterals: [],
  },
  {
    name: "Portal Mage",
    wearableIds: [104, 105, 106],
    traitsBonuses: [4, 0, 2, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Supreme Portal Mage",
    wearableIds: [104, 105, 107],
    traitsBonuses: [6, 0, 3, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Rastafarian",
    wearableIds: [108, 109, 110],
    traitsBonuses: [3, 0, -2, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Off Duty Hazmat",
    wearableIds: [111, 112, 123],
    traitsBonuses: [4, 2, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "On Duty Hazmat",
    wearableIds: [111, 112, 113],
    traitsBonuses: [6, 3, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Blue Vacationer",
    wearableIds: [115, 116, 117],
    traitsBonuses: [4, -2, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Red Vacationer",
    wearableIds: [114, 116, 117],
    traitsBonuses: [5, -2, 0, -1, 0],
    allowedCollaterals: [],
  },
  {
    name: "Crypto OG",
    wearableIds: [12, 19, 36, 40, 77],
    traitsBonuses: [4, 0, 0, 0, -2],
    allowedCollaterals: [],
  },
  {
    name: "Rektboi",
    wearableIds: [29, 45, 46],
    traitsBonuses: [4, 0, 0, 0, -2],
    allowedCollaterals: [],
  },
  {
    name: "Man of Culture",
    wearableIds: [47, 59, 74],
    traitsBonuses: [4, 0, 0, 0, -2],
    allowedCollaterals: [],
  },
  {
    name: "Curve Surfer",
    wearableIds: [66, 76, 115],
    traitsBonuses: [4, 0, 0, 0, 2],
    allowedCollaterals: [],
  },
  {
    name: "PoW Miner",
    wearableIds: [25, 77, 89],
    traitsBonuses: [3, 0, 2, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Toddler",
    wearableIds: [90, 91, 119],
    traitsBonuses: [4, 0, -2, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "FU Money",
    wearableIds: [35, 114, 117, 120],
    traitsBonuses: [6, 0, -3, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Farmer Alf",
    wearableIds: [13, 67, 68, 69],
    traitsBonuses: [5, -3, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Battle Santa",
    wearableIds: [5, 13, 71, 106],
    traitsBonuses: [5, 0, 3, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Party Animal",
    wearableIds: [109, 40, 124],
    traitsBonuses: [5, 0, 0, 0, -3],
    allowedCollaterals: [],
  },
  {
    name: "Snapshot Voter",
    wearableIds: [137, 138, 139],
    traitsBonuses: [3, 0, -2, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Polygonist",
    wearableIds: [134, 135, 136],
    traitsBonuses: [3, 0, -1, 0, 1],
    allowedCollaterals: [],
  },
  {
    name: "Quickswap Dragon",
    wearableIds: [130, 131, 132],
    traitsBonuses: [3, 0, 1, 1, 0],
    allowedCollaterals: [],
  },
  {
    name: "Swappy the Dragon",
    wearableIds: [130, 132, 133],
    traitsBonuses: [4, 0, 1, 1, 0],
    allowedCollaterals: [],
  },
  {
    name: "Gotchi Elf",
    wearableIds: [140, 141, 142],
    traitsBonuses: [3, 0, 0, -1, 1],
    allowedCollaterals: [],
  },
  {
    name: "Gotchi Princess",
    wearableIds: [140, 141, 142, 143],
    traitsBonuses: [4, 1, 1, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Gotchi Queen",
    wearableIds: [140, 141, 144, 143],
    traitsBonuses: [5, 0, 0, -2, 1],
    allowedCollaterals: [],
  },
  {
    name: "Godli Locks",
    wearableIds: [140, 141, 145, 143],
    traitsBonuses: [6, 0, 0, -2, 2],
    allowedCollaterals: [],
  },
  {
    name: "Gotchi Baron",
    wearableIds: [146, 147, 148],
    traitsBonuses: [3, -1, 0, 0, -1],
    allowedCollaterals: [],
  },
  {
    name: "Gotchi Lord",
    wearableIds: [146, 147, 148, 150],
    traitsBonuses: [5, -1, 0, 0, -2],
    allowedCollaterals: [],
  },
  {
    name: "Gotchi King",
    wearableIds: [146, 149, 148, 150],
    traitsBonuses: [5, -2, 0, 0, -1],
    allowedCollaterals: [],
  },
  {
    name: "Gotchi Emperor",
    wearableIds: [146, 149, 148, 150, 156],
    traitsBonuses: [6, -2, 0, 0, -2],
    allowedCollaterals: [],
  },
  {
    name: "Lil Pumpagotchi",
    wearableIds: [157, 158, 159, 160, 161],
    traitsBonuses: [6, 2, 2, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Soundcloud Rapper",
    wearableIds: [108, 157, 158, 159, 160],
    traitsBonuses: [5, 1, 2, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "REALM Tycoon",
    wearableIds: [84, 85, 86, 146],
    traitsBonuses: [4, -1, -1, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Yegres the Dragon",
    wearableIds: [14, 131, 132, 44],
    traitsBonuses: [5, 0, 0, 1, 2],
    allowedCollaterals: [],
  },
  {
    name: "Vacation Santa",
    wearableIds: [71, 114, 120, 117],
    traitsBonuses: [5, -1, -1, -1, 0],
    allowedCollaterals: [],
  },

  //new

  {
    name: "VR Gamer",
    wearableIds: [202, 203, 204],
    traitsBonuses: [5, 2, 1, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Steampunk",
    wearableIds: [199, 200, 201],
    traitsBonuses: [4, 0, 0, 2, 0],
    allowedCollaterals: [],
  },
  {
    name: "Casual Gamer",
    wearableIds: [117, 203, 204],
    traitsBonuses: [3, 1, 1, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Gentleman Farmer",
    wearableIds: [69, 146, 200],
    traitsBonuses: [2, 0, 0, 1, 0],
    allowedCollaterals: [],
  },
  {
    name: "Cyberpunk",
    wearableIds: [43, 48, 202],
    traitsBonuses: [5, 3, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    name: "Steampunk Grenadier",
    wearableIds: [1, 2, 6, 199],
    traitsBonuses: [3, 0, 0, 2, 0],
    allowedCollaterals: [],
  },

  {
    setId: 93,
    name: "Venly Biker",
    wearableIds: [206, 207, 208, 209],
    traitsBonuses: [4, 1, 1, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 94,
    name: "Hacker Aanon",
    wearableIds: [211, 212, 213],
    traitsBonuses: [5, -2, 0, 0, 1],
    allowedCollaterals: [],
  },
  {
    setId: 95,
    name: "Shadowy Supercoder",
    wearableIds: [212, 213, 214],
    traitsBonuses: [6, -2, 0, 0, 1],
    allowedCollaterals: [],
  },
  {
    setId: 96,
    name: "Cyborg ",
    wearableIds: [215, 216, 217],
    traitsBonuses: [5, 0, 3, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 97,
    name: "Punk Rocker",
    wearableIds: [218, 219, 220],
    traitsBonuses: [4, 0, 2, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 98,
    name: "Piraate",
    wearableIds: [221, 222, 223, 224],
    traitsBonuses: [3, 0, 0, 0, -2],
    allowedCollaterals: [],
  },
  {
    setId: 99,
    name: "Aair Gotchi",
    wearableIds: [225, 226, 227],
    traitsBonuses: [3, 2, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 100,
    name: "Wraangler",
    wearableIds: [228, 229, 230],
    traitsBonuses: [2, 0, 1, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 101,
    name: "Ranchero",
    wearableIds: [231, 232, 233],
    traitsBonuses: [2, -1, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 102,
    name: "Ranchero",
    wearableIds: [231, 232, 236],
    traitsBonuses: [2, -1, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 103,
    name: "Ranchero",
    wearableIds: [231, 232, 237],
    traitsBonuses: [2, -1, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 104,
    name: "Ranchero",
    wearableIds: [231, 232, 238],
    traitsBonuses: [2, -1, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 105,
    name: "Novice Shaaman",
    wearableIds: [233, 234, 235],
    traitsBonuses: [5, -3, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 106,
    name: "Shaaman Priest",
    wearableIds: [234, 235, 236],
    traitsBonuses: [5, -3, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 107,
    name: "Shaaman Mystic",
    wearableIds: [234, 235, 237],
    traitsBonuses: [5, -3, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 108,
    name: "Master Shaaman",
    wearableIds: [234, 235, 238],
    traitsBonuses: [6, -3, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 109,
    name: "WGMI Wagie ",
    wearableIds: [239, 240, 241],
    traitsBonuses: [3, 0, -2, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 110,
    name: "YOLO Guy",
    wearableIds: [242, 243, 244],
    traitsBonuses: [4, -1, -1, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 111,
    name: "Psychonaut",
    wearableIds: [234, 235, 238, 53],
    traitsBonuses: [7, -3, 0, 0, 1],
    allowedCollaterals: [],
  },
  {
    setId: 112,
    name: "Tech Bro",
    wearableIds: [242, 243, 244, 212],
    traitsBonuses: [5, -2, 0, 0, 1],
    allowedCollaterals: [],
  },
  {
    setId: 113,
    name: "Gunslinger",
    wearableIds: [231, 228, 58, 58],
    traitsBonuses: [3, 0, 2, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 114,
    name: "We Are Legion",
    wearableIds: [85, 211, 212],
    traitsBonuses: [5, 0, 0, 3, 0],
    allowedCollaterals: [],
  },
  {
    setId: 115,
    name: "Aastronaut",
    wearableIds: [252, 253, 254],
    traitsBonuses: [1, 0, 0, 1, 0],
    allowedCollaterals: [],
  },
  {
    setId: 116,
    name: "Geckogotchi",
    wearableIds: [249, 250, 251],
    traitsBonuses: [2, 1, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 117,
    name: "Super Geckogotchi",
    wearableIds: [245, 249, 250, 251],
    traitsBonuses: [3, 0, 0, -1, -1],
    allowedCollaterals: [],
  },
  {
    setId: 118,
    name: "Lil Bubble",
    wearableIds: [255, 256, 257],
    traitsBonuses: [4, 2, -1, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 119,
    name: "Radar",
    wearableIds: [261, 262, 263],
    traitsBonuses: [5, 0, -1, 0, 2],
    allowedCollaterals: [],
  },
  {
    setId: 120,
    name: "Laozigotchi",
    wearableIds: [258, 259, 260],
    traitsBonuses: [6, -2, 0, 0, 1],
    allowedCollaterals: [],
  },
  {
    setId: 121,
    name: "Wandering Sage",
    wearableIds: [65, 258, 259, 260],
    traitsBonuses: [7, -2, 0, 0, 2],
    allowedCollaterals: [],
  },
  {
    setId: 122,
    name: "APY Visionary",
    wearableIds: [246, 247, 248],
    traitsBonuses: [2, 1, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 123,
    name: "Aarcher",
    wearableIds: [292, 293, 294],
    traitsBonuses: [1, 0, -1, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 124,
    name: "Baarbarian",
    wearableIds: [295, 296, 297, 298],
    traitsBonuses: [2, 0, 1, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 125,
    name: "Raanger",
    wearableIds: [293, 299, 300],
    traitsBonuses: [2, -1, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 126,
    name: "Geisha",
    wearableIds: [301, 302, 303, 304],
    traitsBonuses: [3, 0, -2, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 127,
    name: "Fairy",
    wearableIds: [306, 307, 308],
    traitsBonuses: [4, -1, 0, -1, 0],
    allowedCollaterals: [],
  },
  {
    setId: 128,
    name: "Sus Fairy",
    wearableIds: [305, 306, 307, 308],
    traitsBonuses: [4, -1, 0, -1, 0],
    allowedCollaterals: [],
  },
  {
    setId: 129,
    name: "Knight",
    wearableIds: [309, 310, 311],
    traitsBonuses: [5, 2, -1, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 130,
    name: "Citaadel Knight",
    wearableIds: [309, 310, 311, 312],
    traitsBonuses: [5, 1, -2, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 131,
    name: "Bushidogotchi",
    wearableIds: [313, 314, 315],
    traitsBonuses: [6, 0, 1, 2, 0],
    allowedCollaterals: [],
  },
  {
    setId: 132,
    name: "Robin Hood",
    wearableIds: [18, 293, 294, 300],
    traitsBonuses: [2, -1, 0, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 133,
    name: "Nure-onna",
    wearableIds: [249, 302, 303, 304],
    traitsBonuses: [3, 0, -2, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 134,
    name: "Tinkerbell",
    wearableIds: [148, 306, 307, 308],
    traitsBonuses: [4, -1, 0, -1, 0],
    allowedCollaterals: [],
  },
  {
    setId: 135,
    name: "Rave Gurl",
    wearableIds: [216, 120, 49, 235, 307],
    traitsBonuses: [5, -1, 1, -1, 0],
    allowedCollaterals: [],
  },
  {
    setId: 136,
    name: "Off Duty Knight",
    wearableIds: [99, 122, 144, 310],
    traitsBonuses: [5, 1, 0, -2, 0],
    allowedCollaterals: [],
  },
  {
    setId: 137,
    name: "Daimyogotchi",
    wearableIds: [155, 313, 314, 315],
    traitsBonuses: [7, 0, 1, 2, -1],
    allowedCollaterals: [],
  },
  {
    setId: 138,
    name: "Shogungotchi",
    wearableIds: [156, 313, 314, 315],
    traitsBonuses: [8, -1, 1, 2, -1],
    allowedCollaterals: [],
  },
  {
    setId: 139,
    name: "Noble Savage",
    wearableIds: [146, 296, 297, 298],
    traitsBonuses: [2, 0, 1, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 140,
    name: "Elven Aarcher",
    wearableIds: [140, 292, 293, 294],
    traitsBonuses: [1, 0, -1, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 141,
    name: "Elven Raanger",
    wearableIds: [140, 141, 293, 299, 300],
    traitsBonuses: [2, 0, 0, -1, 0],
    allowedCollaterals: [],
  },
  {
    setId: 142,
    name: "Woodland Critter",
    wearableIds: [293, 300, 140, 40],
    traitsBonuses: [2, 0, 0, -1, 0],
    allowedCollaterals: [],
  },
  {
    setId: 143,
    name: "Vacation Geisha",
    wearableIds: [115, 304, 243, 302],
    traitsBonuses: [4, 0, -2, 0, 0],
    allowedCollaterals: [],
  },
  {
    setId: 144,
    name: "Tooth Fairy",
    wearableIds: [306, 307, 308, 93],
    traitsBonuses: [4, 0, 0, -2, 0],
    allowedCollaterals: [],
  },
];

function sixteenBitArrayToUint(array: number[] | string[]) {
  const uint = [];
  for (let item of array) {
    if (typeof item === "string") {
      item = parseInt(item);
    }
    uint.unshift(item.toString(16).padStart(4, "0"));
  }
  if (array.length > 0) return BigNumber.from("0x" + uint.join(""));
  return BigNumber.from(0);
}

function eightBitIntArrayToUint(array: number[] | string[]) {
  if (array.length === 0) {
    return BigNumber.from(0);
  }
  const uint = [];
  for (const num of array) {
    if (num > 127) {
      throw Error("Value beyond signed 8 int ");
    }
    const value = BigNumber.from(num).toTwos(8);
    uint.unshift(value.toHexString().slice(2));
  }
  return BigNumber.from("0x" + uint.join(""));
}

const wearableSets = [];
for (const wearableSet of wearableSetArrays) {
  if (!Array.isArray(wearableSet.allowedCollaterals)) {
    console.log(wearableSet);
    throw Error("Is not array");
  }
  wearableSets.push({
    name: wearableSet.name,
    wearableIds: wearableSet.wearableIds,
    traitsBonuses: wearableSet.traitsBonuses,
    allowedCollaterals: wearableSet.allowedCollaterals,
  });
}

exports.wearableSets = wearableSets;
