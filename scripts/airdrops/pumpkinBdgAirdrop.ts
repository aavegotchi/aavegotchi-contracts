import { run } from "hardhat";
import { itemTypes } from "../../scripts/addItemTypes/itemTypes/pumpkinBdg";
import {
  updateBaadgeTaskForSvgType,
  mintSvgTaskForBaadges,
  airdropTaskForBaadges,
} from "../../scripts/svgHelperFunctions";
import { hasDuplicateGotchiIds } from "../../scripts/helperFunctions";
import { pumpkinSmashData } from "../../data/airdrops/badges/pumpkinSmashing";

export async function main() {
  const baadge: string[] = [
    "GotchiSmaash2022-Baadge-Final-Pixelart", //332
  ];

  //Upload SVGs
  let upload = await updateBaadgeTaskForSvgType(baadge, "pumpkinBadge", [332]);

  await run("updateSvgs", upload);

  //Mint baadge item types
  let mint = await mintSvgTaskForBaadges("pumpkinBdg");

  console.log("mint:", mint);
  await run("mintBaadgeSvgs", mint);

  //Airdrop
  let players: string[] = [];
  for (let index = 0; index < pumpkinSmashData.length; index++) {
    if (!players.includes(pumpkinSmashData[index].toString())) {
      players.push(pumpkinSmashData[index].toString());
    }
  }

  console.log("Total amount of players: ", players.length);
  console.log("Max Rank Baadge amount: ", itemTypes[0].maxQuantity);

  console.log(
    "Does totalPlaayers Array Have Duplicates: ",
    await hasDuplicateGotchiIds(players)
  );

  console.log(itemTypes[0].name);
  const playerNumbersArray: number[] = [];
  for (let x = 0; x < players.length; x++) {
    playerNumbersArray.push(Number(players[x]));
  }

  const perBatch = 200;
  const batches = Math.ceil(playerNumbersArray.length / perBatch);

  console.log("Begin airdrops!");

  for (let index = 0; index < batches; index++) {
    console.log("Airdropping batch:", index);
    let gotchiBatch = playerNumbersArray.slice(
      index * perBatch,
      (index + 1) * perBatch
    );

    let playerAirdrop = await airdropTaskForBaadges(
      [itemTypes[0]],
      gotchiBatch
    );

    await run("airdropBaadges", playerAirdrop);
    console.log("Complete Airdropping batch:", index);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
