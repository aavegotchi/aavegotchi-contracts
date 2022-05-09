import { run } from "hardhat";
import { itemTypes } from "../../scripts/addItemTypes/itemTypes/rfSzn3Bdgs";
// import { baadges } from "../../svgs/rfSzn3BdgsSvgs";
import {
  updateBaadgeTaskForSvgType,
  mintSvgTaskForBaadges,
  airdropTaskForBaadges,
  updateSvgTaskForSvgType,
} from "../../scripts/svgHelperFunctions";

export async function main() {
  const baadges: string[] = [
    "Aavegotchi-RF-SZN3-Trophy-RARITY-CHAMP", //316
    "Aavegotchi-RF-SZN3-Trophy-KINSHIP-CHAMP", //317
    "Aavegotchi-RF-SZN3-Trophy-XP-CHAMP", //318
    "Aavegotchi-RF-SZN3-Trophy-RARITY-2ND", //319
    "Aavegotchi-RF-SZN3-Trophy-KINSHIP-2ND", //320
    "Aavegotchi-RF-SZN3-Trophy-XP-2ND", //321
    "Aavegotchi-RF-SZN3-Trophy-RARITY-3RD", //322
    "Aavegotchi-RF-SZN3-Trophy-KINSHIP-3RD", //323
    "Aavegotchi-RF-SZN3-Trophy-XP-3RD", //324

    "Aavegotchi-RF-SZN3-Baadges-PLAAYER-RAANKED", //325
    "Aavegotchi-RF-SZN3-Baadges-RARITY-T10", //326
    "Aavegotchi-RF-SZN3-Baadges-KINSHIP-T10", //327
    "Aavegotchi-RF-SZN3-Baadges-XP-T10", //328
    "Aavegotchi-RF-SZN3-Baadges-RARITY-T100", //329
    "Aavegotchi-RF-SZN3-Baadges-KINSHIP-T100", //330
    "Aavegotchi-RF-SZN3-Baadges-XP-T100", //331
  ];

  //Upload SVGs
  let ids: number[] = [];
  for (let i = 316; i <= 331; i++) {
    ids.push(i);
  }
  let upload = await updateBaadgeTaskForSvgType(baadges, "sZN3Baadges", ids);
  console.log("upload:", upload);

  await run("updateSvgs", upload);

  //Mint baadge item types
  let mint = await mintSvgTaskForBaadges("rfSzn3Bdgs");

  console.log("mint:", mint);
  await run("mintBaadgeSvgs", mint);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
