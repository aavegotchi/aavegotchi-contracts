import { run } from "hardhat";
import { itemTypes } from "../../scripts/addItemTypes/itemTypes/rankRf3AddedMint";
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

import { dataArgs as dataArgs1 } from "../../data/airdrops/rarityfarming/szn3/rnd1";
import { dataArgs as dataArgs2 } from "../../data/airdrops/rarityfarming/szn3/rnd2";
import { dataArgs as dataArgs3 } from "../../data/airdrops/rarityfarming/szn3/rnd3";
import { dataArgs as dataArgs4 } from "../../data/airdrops/rarityfarming/szn3/rnd4";

export async function main() {
  const baadges: string[] = ["Aavegotchi-RF-SZN3-Baadges-PLAAYER-RAANKED"];

  //Upload SVGs
  let ids: number[] = [332];

  let upload = await updateBaadgeTaskForSvgType(
    baadges,
    "sZN3AddedRankingBdg",
    ids
  );

  await run("updateSvgs", upload);

  //Mint baadge item types
  let mint = await mintSvgTaskForBaadges("rankRf3AddedMint");
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

  const rarityPlaayers = await getPlaayersIds(rarityArray);
  const kinshipPlaayers = await getPlaayersIds(kinshipArray);
  const xpPlaayers = await getPlaayersIds(xpArray);

  const plaayers = [rarityPlaayers, kinshipPlaayers, xpPlaayers];
  const totalUniquePlaayers = await getPlaayersIds(plaayers);
  const addedPlayers = totalUniquePlaayers.slice(11000, 12565);
  console.log("Total Added Players: ", addedPlayers.length);

  console.log(
    "Does totalPlaayers Array Have Duplicates: ",
    await hasDuplicateGotchiIds(addedPlayers)
  );

  console.log(itemTypes[0].name);
  const raankingNumbersArray: number[] = [];
  for (let x = 0; x < addedPlayers.length; x++) {
    raankingNumbersArray.push(Number(addedPlayers[x]));
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
      [itemTypes[0]],
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
