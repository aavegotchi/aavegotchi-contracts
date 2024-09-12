import { SleeveObject, ItemTypeInputNew } from "../scripts/itemTypeHelpers";
import { wearable } from "../scripts/svgHelperFunctions";
import { itemTypes } from "../data/itemTypes/gotchigangwearables";

export function getWearables() {
  const wearables: string[] = [];
  const sleeves: SleeveObject[] = [];

  itemTypes.forEach((itemType: ItemTypeInputNew) => {
    const wearableName = itemType.name.split(" ").join("");
    console.log("wearable name:", wearableName);

    wearables.push(wearable(`${itemType.svgId}_${wearableName}`, "svgItems"));
  });

  return { sleeves: sleeves, wearables: wearables };
}
