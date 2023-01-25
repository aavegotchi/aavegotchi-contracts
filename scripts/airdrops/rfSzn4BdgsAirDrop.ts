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
    "Aavegotchi-RF-SZN4-Trophy-CHAMP-RARITY", //334
    "Aavegotchi-RF-SZN4-Trophy-CHAMP-KINSHIP", //335
    "Aavegotchi-RF-SZN4-Trophy-CHAMP-XP", //336
    "Aavegotchi-RF-SZN4-Trophy-2ND-RARITY", //337
    "Aavegotchi-RF-SZN4-Trophy-2ND-KINSHIP", //338
    "Aavegotchi-RF-SZN4-Trophy-2ND-XP", //339
    "Aavegotchi-RF-SZN4-Trophy-3RD-RARITY", //340
    "Aavegotchi-RF-SZN4-Trophy-3RD-KINSHIP", //341
    "Aavegotchi-RF-SZN4-Trophy-3RD-XP", //342

    "Aavegotchi-RF-SZN4-Baadge-RAANKED", //343
    "Aavegotchi-RF-SZN4-Baadge-TOP10-RARITY", //344
    "Aavegotchi-RF-SZN4-Baadge-TOP10-KINSHIP", //345
    "Aavegotchi-RF-SZN4-Baadge-TOP10-XP", //346
    "Aavegotchi-RF-SZN4-Baadge-TOP100-RARITY", //347
    "Aavegotchi-RF-SZN4-Baadge-TOP100-KINSHIP", //348
    "Aavegotchi-RF-SZN4-Baadge-TOP100-XP", //349
  ];

  // //Upload SVGs
  // let ids: number[] = [];
  // for (let i = 334; i <= 349; i++) {
  //   ids.push(i);
  // }
  // let upload = await updateBaadgeTaskForSvgType(baadges, "sZN4Baadges", ids);

  // await run("updateSvgs", upload);

  // //Mint baadge item types
  // let mint = await mintSvgTaskForBaadges("rfSzn4Bdgs");

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
  console.log("Max Rank Baadge amount: ", itemTypes[9].maxQuantity);

  console.log(
    "Does totalPlaayers Array Have Duplicates: ",
    await hasDuplicateGotchiIds(totalPlaayers)
  );

  console.log(itemTypes[0].name);
  console.log("Rarity Chaamp: ", rarityRFSzn4[0]);
  const rarityChaampion = await airdropTaskForBaadges(
    [itemTypes[0]],
    [rarityRFSzn4[0]]
  );
  await run("airdropBaadges", rarityChaampion);

  console.log(itemTypes[1].name);
  const kinshipChaampion = await airdropTaskForBaadges(
    [itemTypes[1]],
    [kinshipRFSzn4[0]]
  );
  await run("airdropBaadges", kinshipChaampion);

  //xp tie breakers go to gotchi id: 6952 for higher rf 4 average xp score
  console.log(itemTypes[2].name);
  console.log("XP Chaampion: ", xpRFSzn4[0]);
  const xpChaampion = await airdropTaskForBaadges(
    [itemTypes[2]],
    [xpRFSzn4[0]]
  );
  await run("airdropBaadges", xpChaampion);

  console.log(itemTypes[3].name);
  const rarity2nd = await airdropTaskForBaadges(
    [itemTypes[3]],
    [rarityRFSzn4[1]]
  );
  await run("airdropBaadges", rarity2nd);

  console.log(itemTypes[4].name);
  const kinship2nd = await airdropTaskForBaadges(
    [itemTypes[4]],
    [kinshipRFSzn4[1]]
  );
  await run("airdropBaadges", kinship2nd);

  console.log(itemTypes[5].name);
  const xp2nd = await airdropTaskForBaadges([itemTypes[5]], [xpRFSzn4[1]]);
  await run("airdropBaadges", xp2nd);

  console.log(itemTypes[6].name);
  const rarity3rd = await airdropTaskForBaadges(
    [itemTypes[6]],
    [rarityRFSzn4[2]]
  );
  await run("airdropBaadges", rarity3rd);

  console.log(itemTypes[7].name);
  const kinship3rd = await airdropTaskForBaadges(
    [itemTypes[7]],
    [kinshipRFSzn4[2]]
  );
  await run("airdropBaadges", kinship3rd);

  console.log(itemTypes[8].name);
  const xp3rd = await airdropTaskForBaadges([itemTypes[8]], [xpRFSzn4[2]]);
  await run("airdropBaadges", xp3rd);

  console.log(itemTypes[10].name);
  const rarityTop10 = await airdropTaskForBaadges([itemTypes[10]], top10rarity);
  await run("airdropBaadges", rarityTop10);

  console.log(itemTypes[11].name);
  const kinshipTop10 = await airdropTaskForBaadges(
    [itemTypes[11]],
    top10kinship
  );
  await run("airdropBaadges", kinshipTop10);

  console.log(itemTypes[12].name);
  const xpTop10 = await airdropTaskForBaadges([itemTypes[12]], top10xp);
  await run("airdropBaadges", xpTop10);

  console.log(itemTypes[13].name);
  const rarityTop100 = await airdropTaskForBaadges(
    [itemTypes[13]],
    top100rarity
  );
  await run("airdropBaadges", rarityTop100);

  console.log(itemTypes[14].name);
  const kinshipTop100 = await airdropTaskForBaadges(
    [itemTypes[14]],
    top100kinship
  );
  await run("airdropBaadges", kinshipTop100);

  console.log(itemTypes[15].name);
  const xpTop100 = await airdropTaskForBaadges([itemTypes[15]], top100xp);
  await run("airdropBaadges", xpTop100);

  console.log(itemTypes[9].name);

  const raankingNumbersArray: number[] = [];
  for (let x = 0; x < totalPlaayers.length; x++) {
    raankingNumbersArray.push(Number(totalPlaayers[x]));
  }

  const perBatch = 200;
  const batches = Math.ceil(raankingNumbersArray.length / perBatch);

  console.log("Begin airdrops!");

  for (let index = 0; index < batches; index++) {
    console.log("Airdropping batch:", index);
    let gotchiBatch = raankingNumbersArray.slice(
      index * perBatch,
      (index + 1) * perBatch
    );

    let plaayerAirdrop = await airdropTaskForBaadges(
      [itemTypes[9]],
      gotchiBatch
    );

    await run("airdropBaadges", plaayerAirdrop);
    console.log("Complete Airdropping batch:", index);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
