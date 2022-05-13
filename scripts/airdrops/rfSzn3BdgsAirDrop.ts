import { run } from "hardhat";
import { itemTypes } from "../../scripts/addItemTypes/itemTypes/rfSzn3Bdgs";
// import { baadges } from "../../svgs/rfSzn3BdgsSvgs";
import {
  updateBaadgeTaskForSvgType,
  mintSvgTaskForBaadges,
  airdropTaskForBaadges,
  updateSvgTaskForSvgType,
} from "../../scripts/svgHelperFunctions";

import {
  getRfSznTypeRanking,
  getPlaayersIds,
  hasDuplicateGotchiIds,
} from "../../scripts/helperFunctions";

import { dataArgs as dataArgs1 } from "../../data/airdrops/rarityfarming/szn3/rnd1";
import { dataArgs as dataArgs2 } from "../../data/airdrops/rarityfarming/szn3/rnd2";
import { dataArgs as dataArgs3 } from "../../data/airdrops/rarityfarming/szn3/rnd3";
import { dataArgs as dataArgs4 } from "../../data/airdrops/rarityfarming/szn3/rnd4";
import { rarity } from "../../data/airdrops/badges/airdropTokenIdArrays";

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

  // //Upload SVGs
  // let ids: number[] = [];
  // for (let i = 316; i <= 331; i++) {
  //   ids.push(i);
  // }
  // let upload = await updateBaadgeTaskForSvgType(baadges, "sZN3Baadges", ids);

  // await run("updateSvgs", upload);

  // //Mint baadge item types
  // let mint = await mintSvgTaskForBaadges("rfSzn3Bdgs");

  // console.log("mint:", mint);
  // await run("mintBaadgeSvgs", mint);

  //Airdrop
  const rarityArray = [
    dataArgs1.rarityGotchis,
    dataArgs2.rarityGotchis,
    dataArgs3.rarityGotchis,
    dataArgs4.rarityGotchis,
  ];
  const kinshipArray = [
    dataArgs1.kinshipGotchis,
    dataArgs2.kinshipGotchis,
    dataArgs3.kinshipGotchis,
    dataArgs4.kinshipGotchis,
  ];
  const xpArray = [
    dataArgs1.xpGotchis,
    dataArgs2.xpGotchis,
    dataArgs3.xpGotchis,
    dataArgs4.xpGotchis,
  ];

  const rarityRFSzn3 = await getRfSznTypeRanking(rarityArray, "rarity");
  console.log("Rarity: ", rarityRFSzn3);
  const top10rarity = rarityRFSzn3.slice(3, 10);
  console.log("Top 10 Rarity", top10rarity);
  const top100rarity = rarityRFSzn3.slice(10, 100);
  console.log("Top 100 Rarity", top100rarity);
  console.log("Top 100 Rarity Array Length", top100rarity.length);

  const kinshipRFSzn3 = await getRfSznTypeRanking(kinshipArray, "kinship");
  console.log("Kinship: ", kinshipRFSzn3);
  const top10kinship = kinshipRFSzn3.slice(3, 10);
  console.log("Top 10 Kinship", top10kinship);
  const top100kinship = kinshipRFSzn3.slice(10, 100);
  console.log("Top 100 Kinship", top100kinship);

  const xpRFSzn3 = await getRfSznTypeRanking(xpArray, "xp");
  console.log("XP: ", xpRFSzn3);
  const top10xp = xpRFSzn3.slice(3, 10);
  console.log("Top 10 XP", top10xp);
  const top100xp = xpRFSzn3.slice(10, 100);
  console.log("Top 100 XP", top100xp);
  console.log("Top 10 XP Array Length", top10xp.length);
  console.log("Top 100 XP Array Length", top100xp.length);

  const rarityPlaayers = await getPlaayersIds(rarityArray);
  const kinshipPlaayers = await getPlaayersIds(kinshipArray);
  const xpPlaayers = await getPlaayersIds(xpArray);

  const plaayers = [rarityPlaayers, kinshipPlaayers, xpPlaayers];
  const totalPlaayers = await getPlaayersIds(plaayers);
  console.log("Total Player: ", totalPlaayers);

  // totalPlaayers.push("19095");

  console.log(
    "Does totalPlaayers Array Have Duplicates: ",
    await hasDuplicateGotchiIds(totalPlaayers)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
