import { SleeveObject, ItemTypeInputNew } from "../scripts/itemTypeHelpers";
import {
  bodyWearable,
  BodyWearableOutput,
  wearable,
} from "../scripts/svgHelperFunctions";
import { itemTypes } from "../data/itemTypes/itemTypes";
import { allSleeves } from "./wearables";

//for wearables that have irregular file names
const svgExceptons = [
  0, 11, 36, 37, 42, 43, 46, 53, 60, 61, 62, 63, 64, 65, 66, 67, 69, 70, 71, 74,
  78, 80, 81, 82, 85, 86, 89, 91, 93, 94, 95, 96, 98, 99, 100, 101, 102, 103,
  108, 117, 121, 139, 158, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172,
  173, 174, 175, 210, 211, 217, 227, 236, 242, 244, 248, 250, 251, 253, 255,
  256, 258, 259, 260, 261, 362, 363, 367, 368, 369,
];

const nameExceptions = [
  "Void", //0
  "MessDress", //11
  "ETHMaxiGlasses", //36
  "ETHTShirt", //37
  "NogaraEagleMask", ///42
  "NogaraEagleArmor", //43
  "HalfRektShirt", //46
  "AllSeeingEyes", //53
  "WizardHat", //60
  "WizardHatLegendary", //61
  "WizardHatMythical", //62
  "WizardHatGodlike", //63
  "WizardStaff", //64
  "WizardStaffLegendary", //65,
  "FutureWizardVisor", //66
  "FarmerStrawHat", //67
  "FarmerPitchfork", //69
  "FarmerHandsaw", //70
  "SantagotchiHat", //71
  "JaayHaoSuit", //74
  "SkaterJeans", //78
  "SushiHeadband", //80
  "SushiRobe", //81
  "SushiRoll", //82
  "GentlemanSuit", //85
  "GentlemanMonocle", //86
  "MinerPickaxe", //89
  "PajamaPants", //91
  "FluffyBlanket", //93
  "RunnerSweatband", //94
  "RunnerShorts", //95
  "WaterBottle", //96
  "LadySkirt", //98
  "LadyParasol", //99
  "LadyClutch", //100
  "WitchHat", //101
  "WitchCape", //102
  "WitchWand", //103
  "RastaDreds", //108
  "DealWithItShades", //117
  "WineBottle", //121
  "SnapshotHat", //139
  "LilPumpDrink", //158
  "szn1rnd1top10rarity", //163
  "szn1rnd1top10kinship", //164
  "szn1rnd1top10xp", //165
  "szn1rnd1top100rarity", //166
  "szn1rnd1top100kinship", //167
  "szn1rnd1top100xp", //168
  "szn1rnd2top10rarity", //169
  "szn1rnd2top10kinship", //170
  "szn1rnd2top10xp", //171
  "szn1rnd2top100rarity", //172
  "szn1rnd2top100kinship", //173
  "szn1rnd2top100xp", //174
  "uniclyBaadge", //175
  "H1background", //210
  "GuyFauwkesMask", //211
  "CyborgGun", //217
  "MJJersey", //227
  "BlueCacti", //236
  "YellowManbun",
  "VNeckShirt",
  "UpOnlyShirt",
  // "CoinGeckoEyes",
  "CoinGeckoTee",
  "CoinGeckoCandies",
  "AastronautSuit",
  "LilBubbleHelmet",
  "LilBubbleSpaceSuit",
  "Hanfu",
  "BushyEyebrows",
  "AncientBeard",
  "AantenaBot",
  "FakeShirt",
  "FakeBeret",
  "EyesOfDevotion",
  "BeardOfDivinity",
  "StaffOfCreation",
];

//list 317 -349
// const incompleteWearables = [

//incomplete bas svgs
const skipWearableIds = [
  249, 259, 260, 262, 316, 317, 317, 318, 319, 320, 321, 322, 323, 324, 325,
  326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340,
  341, 342, 343, 344, 345, 346, 347, 348, 349,
];

export function getWearables() {
  const wearables: string[] = [];
  const sleeves: SleeveObject[] = [];
  let wearableName: string;

  itemTypes.forEach((itemType) => {
    itemType as ItemTypeInputNew;

    if (skipWearableIds.includes(Number(itemType.svgId))) return;
    if (svgExceptons.includes(Number(itemType.svgId))) {
      wearableName =
        nameExceptions[svgExceptons.indexOf(Number(itemType.svgId))];
    } else {
      wearableName = itemType.name.split(" ").join("");
    }

    if (
      itemType.slotPositions === "body" &&
      allSleeves.includes(itemType.svgId)
    ) {
      const output: BodyWearableOutput = bodyWearable(
        `${itemType.svgId}_${wearableName}`,
        "svgItems"
      );
      wearables.push(output.wearable);
      sleeves.push(output.sleeves);
    } else {
      wearables.push(wearable(`${itemType.svgId}_${wearableName}`, "svgItems"));
    }
  });

  return { wearables: wearables, sleeves: sleeves };
}

getWearables();
