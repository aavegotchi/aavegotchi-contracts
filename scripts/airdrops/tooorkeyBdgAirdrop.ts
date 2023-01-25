import { run } from "hardhat";
import { itemTypes } from "../addItemTypes/itemTypes/tooorkeyBdg";
import {
  updateBaadgeTaskForSvgType,
  mintSvgTaskForBaadges,
  airdropTaskForBaadges,
} from "../svgHelperFunctions";
import { hasDuplicateGotchiIds } from "../helperFunctions";
import { toorkeyChaserData } from "../../data/airdrops/badges/tooorkeyChasers";

export async function airdropTooorkeyBadge() {
  const baadge: string[] = [
    "Aavegotchi-TOOORKEY-CHAASE-Badge", //333
  ];

  //Upload SVGs
  let upload = await updateBaadgeTaskForSvgType(baadge, "baadges", [333]);

  await run("updateSvgs", upload);

  //Mint baadge item types
  let mint = await mintSvgTaskForBaadges("tooorkeyBdg");

  console.log("mint:", mint);
  await run("mintBaadgeSvgs", mint);

  //Airdrop
  let players: string[] = [];
  for (let index = 0; index < toorkeyChaserData.length; index++) {
    if (!players.includes(toorkeyChaserData[index].toString())) {
      players.push(toorkeyChaserData[index].toString());
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

if (require.main === module) {
  airdropTooorkeyBadge()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
