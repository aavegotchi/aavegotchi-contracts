import { run } from "hardhat";
import { itemTypes } from "../../scripts/addItemTypes/itemTypes/RFSzn4Bdgs";
import {
  updateBaadgeTaskForSvgType,
  mintSvgTaskForBaadges,
  airdropTaskForBaadges,
} from "../../scripts/svgHelperFunctions";

import {
  getRfSznTypeRanking,
  getPlaayersIds,
  hasDuplicateGotchiIds,
} from "../../scripts/helperFunctions";

import { dataArgs as dataArgs1 } from "../../data/airdrops/rarityfarming/szn4/rnd1";
import { dataArgs as dataArgs2 } from "../../data/airdrops/rarityfarming/szn4/rnd2";
import { dataArgs as dataArgs3 } from "../../data/airdrops/rarityfarming/szn4/rnd3";
import { dataArgs as dataArgs4 } from "../../data/airdrops/rarityfarming/szn4/rnd4";

export async function main() {
  const baadges: string[] = [
    "Aavegotchi-RF-SZN4-Trophy-CHAMP-RARITY", //332
    "Aavegotchi-RF-SZN4-Trophy-CHAMP-KINSHIP", //333
    "Aavegotchi-RF-SZN4-Trophy-CHAMP-XP", //334
    "Aavegotchi-RF-SZN4-Trophy-2ND-RARITY", //335
    "Aavegotchi-RF-SZN4-Trophy-2ND-KINSHIP", //336
    "Aavegotchi-RF-SZN4-Trophy-2ND-XP", //337
    "Aavegotchi-RF-SZN4-Trophy-3RD-RARITY", //338
    "Aavegotchi-RF-SZN4-Trophy-3RD-KINSHIP", //339
    "Aavegotchi-RF-SZN4-Trophy-3RD-XP", //340

    "Aavegotchi-RF-SZN4-Baadge-RAANKED", //341
    "Aavegotchi-RF-SZN4-Baadge-TOP10-RARITY", //342
    "Aavegotchi-RF-SZN4-Baadge-TOP10-KINSHIP", //343
    "Aavegotchi-RF-SZN4-Baadge-TOP10-XP", //344
    "Aavegotchi-RF-SZN4-Baadge-TOP100-RARITY", //345
    "Aavegotchi-RF-SZN4-Baadge-TOP100-KINSHIP", //346
    "Aavegotchi-RF-SZN4-Baadge-TOP100-XP", //347
  ];

  //Upload SVGs
  let ids: number[] = [];
  for (let i = 332; i <= 347; i++) {
    ids.push(i);
  }
  let upload = await updateBaadgeTaskForSvgType(baadges, "sZN4Baadges", ids);

  await run("updateSvgs", upload);

  //Mint baadge item types
  let mint = await mintSvgTaskForBaadges("rfSzn4Bdgs");

  console.log("mint:", mint);
  await run("mintBaadgeSvgs", mint);

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

  const rarityRFSzn4 = await getRfSznTypeRanking(rarityArray, "rarity");
  console.log("Rarity: ", rarityRFSzn4);
  const top10rarity = rarityRFSzn4.slice(3, 10);
  console.log("Top 10 Rarity", top10rarity);
  const top100rarity = rarityRFSzn4.slice(10, 100);
  console.log("Top 100 Rarity", top100rarity);
  console.log("Top 100 Rarity Array Length", top100rarity.length);

  const kinshipRFSzn4 = await getRfSznTypeRanking(kinshipArray, "kinship");
  console.log("Kinship: ", kinshipRFSzn4);
  const top10kinship = kinshipRFSzn4.slice(3, 10);
  console.log("Top 10 Kinship", top10kinship);
  const top100kinship = kinshipRFSzn4.slice(10, 100);
  console.log("Top 100 Kinship", top100kinship);

  const xpRFSzn4 = await getRfSznTypeRanking(xpArray, "xp");
  console.log("XP: ", xpRFSzn4);
  const top10xp = xpRFSzn4.slice(3, 10);
  console.log("Top 10 XP", top10xp);
  const top100xp = xpRFSzn4.slice(10, 100);
  console.log("Top 100 XP", top100xp);
  console.log("Top 10 XP Array Length", top10xp.length);
  console.log("Top 100 XP Array Length", top100xp.length);

  const rarityPlaayers = await getPlaayersIds(rarityArray);
  const kinshipPlaayers = await getPlaayersIds(kinshipArray);
  const xpPlaayers = await getPlaayersIds(xpArray);

  const plaayers = [rarityPlaayers, kinshipPlaayers, xpPlaayers];
  const totalPlaayers = await getPlaayersIds(plaayers);
  console.log("Total amount of players: ", totalPlaayers.length);

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
