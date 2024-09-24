import { SleeveObject, ItemTypeInputNew } from "../scripts/itemTypeHelpers";
import {
  bodyWearable,
  BodyWearableOutput,
  wearable,
} from "../scripts/svgHelperFunctions";
import {
  wearablesLeftSvgs,
  wearablesRightSvgs,
  wearablesBackSvgs,
} from "../svgs/wearables-sides";
import { itemTypes } from "../data/itemTypes/itemTypes";
import { allSleeves } from "./wearables";
import { allBadges } from "./BadgeData";
import { badge } from "./allBadges";

//for wearables that have irregular file names
const svgMapping: { [key: number]: string } = {
  0: "Void",
  11: "MessDress",
  36: "ETHMaxiGlasses",
  37: "ETHTShirt",
  42: "NogaraEagleMask",
  43: "NogaraEagleArmor",
  46: "HalfRektShirt",
  53: "AllSeeingEyes",
  60: "WizardHat",
  61: "WizardHatLegendary",
  62: "WizardHatMythical",
  63: "WizardHatGodlike",
  64: "WizardStaff",
  65: "WizardStaffLegendary",
  66: "FutureWizardVisor",
  67: "FarmerStrawHat",
  69: "FarmerPitchfork",
  70: "FarmerHandsaw",
  71: "SantagotchiHat",
  74: "JaayHaoSuit",
  78: "SkaterJeans",
  80: "SushiHeadband",
  81: "SushiRobe",
  82: "SushiRoll",
  85: "GentlemanSuit",
  86: "GentlemanMonocle",
  89: "MinerPickaxe",
  91: "PajamaPants",
  93: "FluffyBlanket",
  94: "RunnerSweatband",
  95: "RunnerShorts",
  96: "WaterBottle",
  98: "LadySkirt",
  99: "LadyParasol",
  100: "LadyClutch",
  101: "WitchHat",
  102: "WitchCape",
  103: "WitchWand",
  108: "RastaDreds",
  117: "DealWithItShades",
  121: "WineBottle",
  139: "SnapshotHat",
  158: "LilPumpDrink",
  210: "H1background",
  211: "GuyFauwkesMask",
  217: "CyborgGun",
  227: "MJJersey",
  236: "BlueCacti",
  242: "YellowManbun",
  244: "VNeckShirt",
  248: "UpOnlyShirt",
  249: "CoinGeckoEyes",
  250: "CoinGeckoTee",
  251: "CoinGeckoCandies",
  253: "AastronautSuit",
  255: "LilBubbleHelmet",
  256: "LilBubbleSpaceSuit",
  258: "Hanfu",
  259: "BushyEyebrows",
  260: "AncientBeard",
  261: "AantenaBot",
  362: "FakeShirt",
  363: "FakeBeret",
  367: "EyesOfDevotion",
  368: "BeardOfDivinity",
  369: "StaffOfCreation",
};

export function getWearables() {
  const wearables: string[] = [];
  const sleeves: SleeveObject[] = [];
  let wearableName: string;
  console.log(itemTypes.length);

  itemTypes.forEach((itemType) => {
    itemType as ItemTypeInputNew;

    wearableName =
      svgMapping[Number(itemType.svgId)] || itemType.name.split(" ").join("");

    if (allBadges.includes(Number(itemType.svgId))) {
      wearables.push(badge(Number(itemType.svgId)));
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

  console.log(wearables.length);
  console.log(`Right side views length: ${wearablesRightSvgs.length}`);
  console.log(`Left side views length: ${wearablesLeftSvgs.length}`);
  console.log(`Back side views length: ${wearablesBackSvgs.length}`);

  if (
    [wearablesRightSvgs, wearablesLeftSvgs, wearablesBackSvgs, wearables].some(
      (arr1, index, arrs) =>
        arrs.slice(index + 1).some((arr2) => arr1.length !== arr2.length)
    )
  ) {
    throw new Error("All side views must be the same length.");
  }
  console.log(
    "returning",
    wearables.length,
    "total wearables and",
    //sleeves has 2 gaps onchain
    sleeves.length + 2,
    "total sleeves and",
    wearablesRightSvgs.length,
    "total side views"
  );

  console.log("All wearable svgs are in sync.");

  return { wearables: wearables, sleeves: sleeves };
}
