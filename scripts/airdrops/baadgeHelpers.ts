import { ItemTypeInputNew } from "../itemTypeHelpers";

import { run } from "hardhat";

import { airdropTaskForBaadges } from "../svgHelperFunctions";
import { getPlaayersIds, hasDuplicateGotchiIds } from "../helperFunctions";

export async function airdropBaadges(
  itemTypes: ItemTypeInputNew[],
  // [top100rarity, top100kinship, top100xp]
  allPlayers: number[][]
) {
  const sendBadge = async (itemType: ItemTypeInputNew, recipient: number) => {
    console.log("Sending", itemType.name, "to", recipient);
    const airdrop = await airdropTaskForBaadges([itemType], [recipient]);
    await run("airdropBaadges", airdrop);
  };

  const sendBadges = async (
    itemType: ItemTypeInputNew,
    recipients: number[]
  ) => {
    const airdrop = await airdropTaskForBaadges([itemType], recipients);
    await run("airdropBaadges", airdrop);
  };

  //we send baadges in the order [rarity, kinship, xp]

  //champions
  await sendBadge(itemTypes[0], allPlayers[0][0]);

  await sendBadge(itemTypes[1], allPlayers[1][0]);

  await sendBadge(itemTypes[2], allPlayers[2][0]);

  //2nd

  await sendBadge(itemTypes[3], allPlayers[0][1]);

  await sendBadge(itemTypes[4], allPlayers[1][1]);

  await sendBadge(itemTypes[5], allPlayers[2][1]);

  //3rd

  await sendBadge(itemTypes[6], allPlayers[0][2]);

  await sendBadge(itemTypes[7], allPlayers[1][2]);

  await sendBadge(itemTypes[8], allPlayers[2][2]);

  //top 10 i.e 4th to 10th

  const top10rarity = allPlayers[0].slice(3, 10);
  const top10kinship = allPlayers[1].slice(3, 10);
  const top10xp = allPlayers[2].slice(3, 10);

  await sendBadges(itemTypes[10], top10rarity);

  await sendBadges(itemTypes[11], top10kinship);

  await sendBadges(itemTypes[12], top10xp);

  //top 100 i.e 11th to 100th
  const top100rarity = allPlayers[0].slice(10, 100);
  const top100kinship = allPlayers[1].slice(10, 100);
  const top100xp = allPlayers[2].slice(10, 100);

  await sendBadges(itemTypes[13], top100rarity);

  await sendBadges(itemTypes[14], top100kinship);

  await sendBadges(itemTypes[15], top100xp);
}

export async function airdropRaankedBaadges(
  itemTypes: ItemTypeInputNew[],
  totalPlaayers: string[]
) {
  //send out raanked baadges

  console.log(itemTypes[9].name);

  const raankingNumbersArray: number[] = [];
  for (let x = 0; x < totalPlaayers.length; x++) {
    raankingNumbersArray.push(Number(totalPlaayers[x]));
  }

  const perBatch = 200;
  const batches = Math.ceil(raankingNumbersArray.length / perBatch);

  console.log("Begin raanked airdrops!");

  //comment out for testing
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

    //await run("airdropBaadges", plaayerAirdrop);
    console.log("Complete Airdropping batch:", index);
  }
}

export async function assertBaadgeQuantities(
  itemTypes: ItemTypeInputNew[],
  rarityArray: string[][],
  kinshipArray: string[][],
  xpArray: string[][]
) {
  //do champion amount checks
  if (
    itemTypes[0].maxQuantity !== 1 ||
    itemTypes[1].maxQuantity !== 1 ||
    itemTypes[2].maxQuantity !== 1
  ) {
    throw new Error("Champion Baadge Quantity is not 1");
  }

  //do 2nd place amount checks
  if (
    itemTypes[3].maxQuantity !== 1 ||
    itemTypes[4].maxQuantity !== 1 ||
    itemTypes[5].maxQuantity !== 1
  ) {
    throw new Error("2nd Place Baadge Quantity is not 1");
  }

  //do 3rd place amount checks

  if (
    itemTypes[6].maxQuantity !== 1 ||
    itemTypes[7].maxQuantity !== 1 ||
    itemTypes[8].maxQuantity !== 1
  ) {
    throw new Error("3rd Place Baadge Quantity is not 1");
  }

  //do top 10 amount checks

  if (
    itemTypes[10].maxQuantity !== 7 ||
    itemTypes[11].maxQuantity !== 7 ||
    itemTypes[12].maxQuantity !== 7
  ) {
    throw new Error("Top 10 Baadge Quantity is not 7");
  }

  //do top 100 amount checks
  if (
    itemTypes[13].maxQuantity !== 90 ||
    itemTypes[14].maxQuantity !== 90 ||
    itemTypes[15].maxQuantity !== 90
  ) {
    throw new Error("Top 100 Baadge Quantity is not 90");
  }

  //do raanked amount checks
  const rarityPlaayers = await getPlaayersIds(rarityArray);
  const kinshipPlaayers = await getPlaayersIds(kinshipArray);
  const xpPlaayers = await getPlaayersIds(xpArray);

  const plaayers = [rarityPlaayers, kinshipPlaayers, xpPlaayers];
  const totalPlaayers_1 = await getPlaayersIds(plaayers);
  //remove duplicates from totalPlaayers
  const totalPlaayers = Array.from(new Set(totalPlaayers_1));
  console.log(
    "Does totalPlaayers Array Have Duplicates: ",
    await hasDuplicateGotchiIds(totalPlaayers)
  );

  if (totalPlaayers.length !== itemTypes[9].maxQuantity) {
    console.log("Total Plaayers: ", totalPlaayers.length);

    console.log("Max Quantity: ", itemTypes[9].maxQuantity);
    throw new Error("Total Plaayers does not match max quantity");
  }
}
