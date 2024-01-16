import { run } from "hardhat";
import { itemTypes } from "../../scripts/addItemTypes/itemTypes/rfSzn5Bdgs";
import {
  updateBaadgeTaskForSvgType,
  mintSvgTaskForBaadges,
  airdropTaskForBaadges,
} from "../../scripts/svgHelperFunctions";

import {
  rankStrings,
  getPlaayersIds,
  hasDuplicateGotchiIds,
} from "../../scripts/helperFunctions";

import { dataArgs as dataArgs1 } from "../../data/airdrops/rarityfarming/szn5/rnd1";
import { dataArgs as dataArgs2 } from "../../data/airdrops/rarityfarming/szn5/rnd2";
import { dataArgs as dataArgs3 } from "../../data/airdrops/rarityfarming/szn5/rnd3";
import { dataArgs as dataArgs4 } from "../../data/airdrops/rarityfarming/szn5/rnd4";

export async function main() {
  const baadges: string[] = [
    "Aavegotchi-RF-SZN5-Trophy-1ST-PLACE-RARITY", //388
    "Aavegotchi-RF-SZN5-Trophy-1ST-PLACE-KINSHIP", //389
    "Aavegotchi-RF-SZN5-Trophy-1ST-PLACE-XP", //390
    "Aavegotchi-RF-SZN5-Trophy-2ND-PLACE-RARITY", //391
    "Aavegotchi-RF-SZN5-Trophy-2ND-PLACE-KINSHIP", //392
    "Aavegotchi-RF-SZN5-Trophy-2ND-PLACE-XP", //393
    "Aavegotchi-RF-SZN5-Trophy-3RD-PLACE-RARITY", //394
    "Aavegotchi-RF-SZN5-Trophy-3RD-PLACE-KINSHIP", //395
    "Aavegotchi-RF-SZN5-Trophy-3RD-PLACE-XP", //396

    "Aavegotchi-RF-SZN5-Baadge-TOP-RAANKED-PLAAYER", //397
    "Aavegotchi-RF-SZN5-Baadge-TOP-10-RARITY", //398
    "Aavegotchi-RF-SZN5-Baadge-TOP-10-KINSHIP", //399
    "Aavegotchi-RF-SZN5-Baadge-TOP-10-XP", //400
    "Aavegotchi-RF-SZN5-Baadge-TOP-100-RARITY", //401
    "Aavegotchi-RF-SZN5-Baadge-TOP-100-KINSHIP", //402
    "Aavegotchi-RF-SZN5-Baadge-TOP-100-XP", //403
  ];

  //Upload SVGs
  let ids: number[] = [];
  for (let i = 388; i <= 403; i++) {
    ids.push(i);
  }
  let upload = await updateBaadgeTaskForSvgType(baadges, "sZN5Baadges", ids);

  await run("updateSvgs", upload);

  //Mint baadge item types
  let mint = await mintSvgTaskForBaadges("rfSzn5Bdgs");

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

  const rarityRFSzn5 = await rankStrings(rarityArray);
  console.log("Rarity: ", rarityRFSzn5);
  const top10rarity = rarityRFSzn5.slice(3, 10);
  console.log("Top 10 Rarity", top10rarity);
  const top100rarity = rarityRFSzn5.slice(10, 100);
  console.log("Top 100 Rarity", top100rarity);
  console.log("Top 100 Rarity Array Length", top100rarity.length);

  const kinshipRFSzn5 = await rankStrings(kinshipArray);
  console.log("Kinship: ", kinshipRFSzn5);
  const top10kinship = kinshipRFSzn5.slice(3, 10);
  console.log("Top 10 Kinship", top10kinship);
  const top100kinship = kinshipRFSzn5.slice(10, 100);
  console.log("Top 100 Kinship", top100kinship);

  const xpRFSzn5 = await rankStrings(xpArray);
  console.log("XP: ", xpRFSzn5);
  const top10xp = xpRFSzn5.slice(3, 10);
  console.log("Top 10 XP", top10xp);
  const top100xp = xpRFSzn5.slice(10, 100);
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
  console.log("Rarity Chaamp: ", rarityRFSzn5[0]);
  const rarityChaampion = await airdropTaskForBaadges(
    [itemTypes[0]],
    [rarityRFSzn5[0]]
  );
  await run("airdropBaadges", rarityChaampion);

  console.log(itemTypes[1].name);
  const kinshipChaampion = await airdropTaskForBaadges(
    [itemTypes[1]],
    [kinshipRFSzn5[0]]
  );
  await run("airdropBaadges", kinshipChaampion);

  console.log(itemTypes[2].name);
  console.log("XP Chaampion: ", xpRFSzn5[0]);
  const xpChaampion = await airdropTaskForBaadges(
    [itemTypes[2]],
    [xpRFSzn5[0]]
  );
  await run("airdropBaadges", xpChaampion);

  console.log(itemTypes[3].name);
  const rarity2nd = await airdropTaskForBaadges(
    [itemTypes[3]],
    [rarityRFSzn5[1]]
  );
  await run("airdropBaadges", rarity2nd);

  console.log(itemTypes[4].name);
  const kinship2nd = await airdropTaskForBaadges(
    [itemTypes[4]],
    [kinshipRFSzn5[1]]
  );
  await run("airdropBaadges", kinship2nd);

  console.log(itemTypes[5].name);
  const xp2nd = await airdropTaskForBaadges([itemTypes[5]], [xpRFSzn5[1]]);
  await run("airdropBaadges", xp2nd);

  console.log(itemTypes[6].name);
  const rarity3rd = await airdropTaskForBaadges(
    [itemTypes[6]],
    [rarityRFSzn5[2]]
  );
  await run("airdropBaadges", rarity3rd);

  console.log(itemTypes[7].name);
  const kinship3rd = await airdropTaskForBaadges(
    [itemTypes[7]],
    [kinshipRFSzn5[2]]
  );
  await run("airdropBaadges", kinship3rd);

  console.log(itemTypes[8].name);
  const xp3rd = await airdropTaskForBaadges([itemTypes[8]], [xpRFSzn5[2]]);
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

  //comment out for testing
  // for (let index = 0; index < batches; index++) {
  //   console.log("Airdropping batch:", index);
  //   let gotchiBatch = raankingNumbersArray.slice(
  //     index * perBatch,
  //     (index + 1) * perBatch
  //   );

  //   let plaayerAirdrop = await airdropTaskForBaadges(
  //     [itemTypes[9]],
  //     gotchiBatch
  //   );

  //   await run("airdropBaadges", plaayerAirdrop);
  //   console.log("Complete Airdropping batch:", index);
  // }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
