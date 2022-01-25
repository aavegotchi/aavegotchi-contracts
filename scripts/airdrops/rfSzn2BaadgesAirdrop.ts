import { run } from "hardhat";
import { itemTypes } from "../../scripts/addItemTypes/itemTypes/rfSzn2Baadges";
import {
  uploadSvgTaskForBaadges,
  mintSvgTaskForBaadges,
  airdropTaskForBaadges,
} from "../../scripts/svgHelperFunctions";
import {
  kinship,
  rarity,
  rookKin,
  rookXP,
  xp,
  topTenKinship,
  top100Kinship,
  topTenRarity,
  top100Rarity,
  topTenRookKin,
  top100RookKin,
  topTenRookXP,
  top100RookXP,
  topTenXP,
  top100XP,
  plaayerTotal,
  plaayerSet1,
  plaayerSet2,
  plaayerSet3,
  plaayerSet4,
  plaayerSet5,
  plaayerSet6,
  plaayerSet7,
  plaayerSet8,
} from "../../data/airdrops/badges/airdropTokenIdArrays";

import { rookieOfYear } from "../../data/airdrops/badges/rfSzn2ROY";

export async function main() {
  // let upload = await uploadSvgTaskForBaadges(itemTypes, "rfSzn2BaadgeSvgs");

  // console.log("upload:", upload);

  // //Upload SVGs
  // for (let index = 0; index < upload.length; index++) {
  //   await run("addBaadgeSvgs", upload[index]);
  // }

  //Mint baadge item types
  // let mint = await mintSvgTaskForBaadges("rfSzn2Baadges");

  // console.log("mint:", mint);
  // await run("mintBaadgeSvgs", mint);

  const perBatch = 200;
  const batches = Math.ceil(plaayerTotal.length / perBatch);

  console.log("Begin airdrops!");

  for (let index = 0; index < batches; index++) {
    console.log("Airdropping batch:", index);
    let gotchiBatch = plaayerTotal.slice(
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

  //Airdro

  //Top Kinship -- Normal and Rookie
  // let top10RookKinAirdrop = await airdropTaskForBaadges(
  //   [itemTypes[24]],
  //   topTenRookKin
  // );
  // await run("airdropBaadges", top10RookKinAirdrop);

  // let top100RookKinAirdrop = await airdropTaskForBaadges(
  //   [itemTypes[26]],
  //   top100RookKin
  // );
  // await run("airdropBaadges", top100RookKinAirdrop);

  // let top10KinshipAirdrop = await airdropTaskForBaadges(
  //   [itemTypes[18]],
  //   topTenKinship
  // );
  // await run("airdropBaadges", top10KinshipAirdrop);

  // let top100KinshipAirdrop = await airdropTaskForBaadges(
  //   [itemTypes[21]],
  //   top100Kinship
  // );
  // await run("airdropBaadges", top100KinshipAirdrop);

  // //Rarity -- Top 10 and Top 100
  // let top10RarityAirdrop = await airdropTaskForBaadges(
  //   [itemTypes[17]],
  //   topTenRarity
  // );
  // await run("airdropBaadges", top10RarityAirdrop);

  // let top100RarityAirdrop = await airdropTaskForBaadges(
  //   [itemTypes[20]],
  //   top100Rarity
  // );
  // await run("airdropBaadges", top100RarityAirdrop);

  // //Rookie of the Year
  // let rookOfTheYrAirdrop = await airdropTaskForBaadges(
  //   [itemTypes[10]],
  //   [Number(rookieOfYear)]
  // );
  // await run("airdropBaadges", rookOfTheYrAirdrop);

  // //Top 10 and Top 100 XP -- Normal and Rookie
  // let top10RookXPAirdrop = await airdropTaskForBaadges(
  //   [itemTypes[23]],
  //   topTenRookXP
  // );
  // await run("airdropBaadges", top10RookXPAirdrop);

  // let top100RookXPAirdrop = await airdropTaskForBaadges(
  //   [itemTypes[25]],
  //   top100RookXP
  // );
  // await run("airdropBaadges", top100RookXPAirdrop);

  // let top10XPAirdrop = await airdropTaskForBaadges([itemTypes[19]], topTenXP);
  // await run("airdropBaadges", top10XPAirdrop);

  // let top100XPAirdrop = await airdropTaskForBaadges([itemTypes[22]], top100XP);
  // await run("airdropBaadges", top100XPAirdrop);

  // //Top 1,2,3 Kinship
  // let kinship1STAirdrop = await airdropTaskForBaadges(
  //   [itemTypes[1]],
  //   [kinship[0]]
  // );
  // await run("airdropBaadges", kinship1STAirdrop);

  // let kinship2NDAirdrop = await airdropTaskForBaadges(
  //   [itemTypes[4]],
  //   [kinship[1]]
  // );
  // await run("airdropBaadges", kinship2NDAirdrop);

  // let kinship3RDAirdrop = await airdropTaskForBaadges(
  //   [itemTypes[7]],
  //   [kinship[2]]
  // );
  // await run("airdropBaadges", kinship3RDAirdrop);

  // //Top 1,2,3 Rookie Kinship
  // let rookKin1STAirdrop = await airdropTaskForBaadges(
  //   [itemTypes[11]],
  //   [rookKin[0]]
  // );
  // await run("airdropBaadges", rookKin1STAirdrop);

  // let rookKin2NDAirdrop = await airdropTaskForBaadges(
  //   [itemTypes[13]],
  //   [rookKin[1]]
  // );
  // await run("airdropBaadges", rookKin2NDAirdrop);

  // let rookKin3RDAirdrop = await airdropTaskForBaadges(
  //   [itemTypes[15]],
  //   [rookKin[2]]
  // );
  // await run("airdropBaadges", rookKin3RDAirdrop);

  // //Top 1,2,3 Rarity
  // let rarity1STAirdrop = await airdropTaskForBaadges(
  //   [itemTypes[0]],
  //   [rarity[0]]
  // );
  // await run("airdropBaadges", rarity1STAirdrop);

  // let rarity2NDAirdrop = await airdropTaskForBaadges(
  //   [itemTypes[3]],
  //   [rarity[1]]
  // );
  // await run("airdropBaadges", rarity2NDAirdrop);

  // let rarity3RDAirdrop = await airdropTaskForBaadges(
  //   [itemTypes[6]],
  //   [rarity[2]]
  // );
  // await run("airdropBaadges", rarity3RDAirdrop);

  // //Top 1,2,3 XP
  // let xp1STAirdrop = await airdropTaskForBaadges([itemTypes[2]], [xp[0]]);
  // await run("airdropBaadges", xp1STAirdrop);

  // let xp2NDAirdrop = await airdropTaskForBaadges([itemTypes[5]], [xp[1]]);
  // await run("airdropBaadges", xp2NDAirdrop);

  // let xp3RDAirdrop = await airdropTaskForBaadges([itemTypes[8]], [xp[2]]);
  // await run("airdropBaadges", xp3RDAirdrop);

  // //Top 1,2,3 Rookie XP
  // let rookXP1STAirdrop = await airdropTaskForBaadges(
  //   [itemTypes[12]],
  //   [rookXP[0]]
  // );
  // await run("airdropBaadges", rookXP1STAirdrop);

  // let rookXP2NDAirdrop = await airdropTaskForBaadges(
  //   [itemTypes[14]],
  //   [rookXP[1]]
  // );
  // await run("airdropBaadges", rookXP2NDAirdrop);

  // let rookXP3RDAirdrop = await airdropTaskForBaadges(
  //   [itemTypes[16]],
  //   [rookXP[2]]
  // );
  // await run("airdropBaadges", rookXP3RDAirdrop);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
