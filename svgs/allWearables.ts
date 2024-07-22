import { SleeveObject, ItemTypeInputNew } from "../scripts/itemTypeHelpers";
import {
  bodyWearable,
  BodyWearableOutput,
  wearable,
} from "../scripts/svgHelperFunctions";
import { itemTypes } from "../data/itemTypes/itemTypes";
import { allSleeves } from "./wearables";
import { allBadges } from "./BadgeData";
import { getBaadge } from "./allBadges";

//for wearables that have irregular file names
const svgExceptons = [
  0, 11, 36, 37, 42, 43, 46, 53, 60, 61, 62, 63, 64, 65, 66, 67, 69, 70, 71, 74,
  78, 80, 81, 82, 85, 86, 89, 91, 93, 94, 95, 96, 98, 99, 100, 101, 102, 103,
  108, 117, 121, 139, 158, 210, 211, 217, 227, 236, 242, 244, 248, 249, 250,
  251, 253, 255, 256, 258, 259, 260, 261, 362, 363, 367, 368, 369,
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
  "H1background", //210
  "GuyFauwkesMask", //211
  "CyborgGun", //217
  "MJJersey", //227
  "BlueCacti", //236
  "YellowManbun", //242
  "VNeckShirt", //244
  "UpOnlyShirt", //248
  "CoinGeckoEyes",
  "CoinGeckoTee", //250
  "CoinGeckoCandies", //251
  "AastronautSuit", //253
  "LilBubbleHelmet", //255
  "LilBubbleSpaceSuit", //256
  "Hanfu", //258
  "BushyEyebrows", //259
  "AncientBeard", //260
  "AantenaBot", //261
  "FakeShirt", //362
  "FakeBeret", //363
  "EyesOfDevotion", //367
  "BeardOfDivinity", //368
  "StaffOfCreation", //369
];

export function getWearables() {
  const wearables: string[] = [];
  const sleeves: SleeveObject[] = [];
  let wearableName: string;

  itemTypes.forEach((itemType) => {
    itemType as ItemTypeInputNew;

    // if (skipWearableIds.includes(Number(itemType.svgId))) return;
    if (svgExceptons.includes(Number(itemType.svgId))) {
      wearableName =
        nameExceptions[svgExceptons.indexOf(Number(itemType.svgId))];
    } else {
      wearableName = itemType.name.split(" ").join("");
    }

    if (allBadges.includes(Number(itemType.svgId))) {
      wearables.push(getBaadge(Number(itemType.svgId)));
    } else if (
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

// getWearables();
