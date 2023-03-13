import { SleeveObject, ItemTypeInputNew } from "../scripts/itemTypeHelpers";
import {
  bodyWearable,
  BodyWearableOutput,
  wearable,
} from "../scripts/svgHelperFunctions";
import { itemTypes } from "../data/itemTypes/forgewearables1";
import { BigNumberish } from "@ethersproject/bignumber";

const bodyWithSleeves: Array<BigNumberish> = [350, 362, 366];
export function getWearables() {
  const wearables: string[] = [];
  const sleeves: SleeveObject[] = [];

  itemTypes.forEach((itemType: ItemTypeInputNew) => {
    const wearableName = itemType.name.split(" ").join("");
    console.log("wearable name:", wearableName);

    if (
      itemType.slotPositions === "body" &&
      bodyWithSleeves.includes(itemType.svgId)
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
