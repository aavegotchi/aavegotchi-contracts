/* eslint-disable  prefer-const */

import { SleeveObject, ItemTypeInputNew } from "../scripts/itemTypeHelpers";
import {
  bodyWearable,
  BodyWearableOutput,
  wearable,
} from "../scripts/svgHelperFunctions";
import { itemTypes } from "../data/itemTypes/raffle5wearables";

export function getWearables() {
  const wearables: string[] = [];
  const sleeves: SleeveObject[] = [];

  itemTypes.forEach((itemType: ItemTypeInputNew) => {
    const wearableName = itemType.name.split(" ").join("");
    console.log("wearable name:", wearableName);

    if (itemType.slotPositions === "body") {
      const output: BodyWearableOutput = bodyWearable(
        `${itemType.svgId}_${wearableName}`,
        "svgItems/raffle5"
      );
      wearables.push(output.wearable);
      sleeves.push(output.sleeves);
    } else {
      wearables.push(
        wearable(`${itemType.svgId}_${wearableName}`, "svgItems/raffle5")
      );
    }
  });

  return { wearables: wearables, sleeves: sleeves };
}
