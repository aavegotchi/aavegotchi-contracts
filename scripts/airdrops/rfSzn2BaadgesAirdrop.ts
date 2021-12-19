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
} from "../../scripts/airdrops/airdropTokenIdArrays";
import { upgrade } from "../../scripts/upgrades/upgrade-aging";

export async function main() {
  // await upgrade();

  let upload = await uploadSvgTaskForBaadges(itemTypes, "rfSzn2BaadgeSvgs");
  for (let index = 0; index < upload.length; index++) {
    await run("addBaadgeSvgs", upload[index]);
  }

  let mint = await mintSvgTaskForBaadges("rfSzn2Baadges");
  await run("mintBaadgeSvgs", mint);

  let top10RookKinAirdrop = await airdropTaskForBaadges(
    [itemTypes[0]],
    topTenRookKin
  );
  await run("airdropBaadges", top10RookKinAirdrop);

  let top100RookKinAirdrop = await airdropTaskForBaadges(
    [itemTypes[1]],
    top100RookKin
  );
  await run("airdropBaadges", top100RookKinAirdrop);

  let top10KinshipAirdrop = await airdropTaskForBaadges(
    [itemTypes[2]],
    topTenKinship
  );
  await run("airdropBaadges", top10KinshipAirdrop);

  let top100KinshipAirdrop = await airdropTaskForBaadges(
    [itemTypes[3]],
    top100Kinship
  );
  await run("airdropBaadges", top100KinshipAirdrop);

  /*   let plaayerAirdrop1 = await airdropTaskForBaadges(
    [itemTypes[4]],
    plaayerSet1
  );
  await run("airdropBaadges", plaayerAirdrop1);

  let plaayerAirdrop2 = await airdropTaskForBaadges(
    [itemTypes[4]],
    plaayerSet2
  );
  await run("airdropBaadges", plaayerAirdrop2);

  let plaayerAirdrop3 = await airdropTaskForBaadges(
    [itemTypes[4]],
    plaayerSet3
  );
  await run("airdropBaadges", plaayerAirdrop3);

  let plaayerAirdrop4 = await airdropTaskForBaadges(
    [itemTypes[4]],
    plaayerSet4
  );
  await run("airdropBaadges", plaayerAirdrop4);

  let plaayerAirdrop5 = await airdropTaskForBaadges(
    [itemTypes[4]],
    plaayerSet5
  );
  await run("airdropBaadges", plaayerAirdrop5);

  let plaayerAirdrop6 = await airdropTaskForBaadges(
    [itemTypes[4]],
    plaayerSet6
  );
  await run("airdropBaadges", plaayerAirdrop6);

  let plaayerAirdrop7 = await airdropTaskForBaadges(
    [itemTypes[4]],
    plaayerSet7
  );
  await run("airdropBaadges", plaayerAirdrop7);

  let plaayerAirdrop8 = await airdropTaskForBaadges(
    [itemTypes[4]],
    plaayerSet8
  );
  await run("airdropBaadges", plaayerAirdrop8); */

  let top10RarityAirdrop = await airdropTaskForBaadges(
    [itemTypes[5]],
    topTenRarity
  );
  await run("airdropBaadges", top10RarityAirdrop);

  let top100RarityAirdrop = await airdropTaskForBaadges(
    [itemTypes[6]],
    top100Rarity
  );
  await run("airdropBaadges", top100RarityAirdrop);

  /*   let rookOfTheYrAirdrop = await airdropTaskForBaadges(
    [itemTypes[7]],
    something here
  );
  await run("airdropBaadges", rookOfTheYrAirdrop); */

  let top10RookXPAirdrop = await airdropTaskForBaadges(
    [itemTypes[8]],
    topTenRookXP
  );
  await run("airdropBaadges", top10RookXPAirdrop);

  let top100RookXPAirdrop = await airdropTaskForBaadges(
    [itemTypes[9]],
    top100RookXP
  );
  await run("airdropBaadges", top100RookXPAirdrop);

  let top10XPAirdrop = await airdropTaskForBaadges([itemTypes[10]], topTenXP);
  await run("airdropBaadges", top10XPAirdrop);

  let top100XPAirdrop = await airdropTaskForBaadges([itemTypes[11]], top100XP);
  await run("airdropBaadges", top100XPAirdrop);

  let kinship1STAirdrop = await airdropTaskForBaadges(
    [itemTypes[12]],
    [kinship[0]]
  );
  await run("airdropBaadges", kinship1STAirdrop);

  let kinship2NDAirdrop = await airdropTaskForBaadges(
    [itemTypes[13]],
    [kinship[1]]
  );
  await run("airdropBaadges", kinship2NDAirdrop);

  let kinship3RDAirdrop = await airdropTaskForBaadges(
    [itemTypes[14]],
    [kinship[2]]
  );
  await run("airdropBaadges", kinship3RDAirdrop);

  let rookKin1STAirdrop = await airdropTaskForBaadges(
    [itemTypes[15]],
    [rookKin[0]]
  );
  await run("airdropBaadges", rookKin1STAirdrop);

  let rookKin2NDAirdrop = await airdropTaskForBaadges(
    [itemTypes[16]],
    [rookKin[1]]
  );
  await run("airdropBaadges", rookKin2NDAirdrop);

  let rookKin3RDAirdrop = await airdropTaskForBaadges(
    [itemTypes[17]],
    [rookKin[2]]
  );
  await run("airdropBaadges", rookKin3RDAirdrop);

  let rarity1STAirdrop = await airdropTaskForBaadges(
    [itemTypes[18]],
    [rarity[0]]
  );
  await run("airdropBaadges", rarity1STAirdrop);

  let rarity2NDAirdrop = await airdropTaskForBaadges(
    [itemTypes[19]],
    [rarity[1]]
  );
  await run("airdropBaadges", rarity2NDAirdrop);

  let rarity3RDAirdrop = await airdropTaskForBaadges(
    [itemTypes[20]],
    [rarity[2]]
  );
  await run("airdropBaadges", rarity3RDAirdrop);

  let xp1STAirdrop = await airdropTaskForBaadges([itemTypes[21]], [xp[0]]);
  await run("airdropBaadges", xp1STAirdrop);

  let xp2NDAirdrop = await airdropTaskForBaadges([itemTypes[22]], [xp[1]]);
  await run("airdropBaadges", xp2NDAirdrop);

  let xp3RDAirdrop = await airdropTaskForBaadges([itemTypes[23]], [xp[2]]);
  await run("airdropBaadges", xp3RDAirdrop);

  let rookXP1STAirdrop = await airdropTaskForBaadges(
    [itemTypes[24]],
    [rookXP[0]]
  );
  await run("airdropBaadges", rookXP1STAirdrop);

  let rookXP2NDAirdrop = await airdropTaskForBaadges(
    [itemTypes[25]],
    [rookXP[1]]
  );
  await run("airdropBaadges", rookXP2NDAirdrop);

  let rookXP3RDAirdrop = await airdropTaskForBaadges(
    [itemTypes[26]],
    [rookXP[2]]
  );
  await run("airdropBaadges", rookXP3RDAirdrop);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
