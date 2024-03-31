import { run } from "hardhat";
import { itemTypes } from "../../scripts/addItemTypes/itemTypes/rfSzn7Bdgs";
import {
  updateBaadgeTaskForSvgType,
  mintSvgTaskForBaadges,
} from "../../scripts/svgHelperFunctions";

import { rankIds } from "../../scripts/helperFunctions";

import { dataArgs as dataArgs1 } from "../../data/airdrops/rarityfarming/szn7/rnd1";
import { dataArgs as dataArgs2 } from "../../data/airdrops/rarityfarming/szn7/rnd2";
import { dataArgs as dataArgs3 } from "../../data/airdrops/rarityfarming/szn7/rnd3";
import { dataArgs as dataArgs4 } from "../../data/airdrops/rarityfarming/szn7/rnd4";
import { getGotchisForASeason } from "../getGotchis";
import {
  assertBaadgeQuantities,
  airdropBaadges,
  airdropRaankedBaadges,
} from "./baadgeHelpers";

export async function main() {
  const baadges: string[] = [
    "Aavegotchi-RF-SZN7-Trophy-1ST-PLACE-RARITY", //420
    "Aavegotchi-RF-SZN7-Trophy-1ST-PLACE-KINSHIP", //421
    "Aavegotchi-RF-SZN7-Trophy-1ST-PLACE-XP", //422
    "Aavegotchi-RF-SZN7-Trophy-2ND-PLACE-RARITY", //423
    "Aavegotchi-RF-SZN7-Trophy-2ND-PLACE-KINSHIP", //424
    "Aavegotchi-RF-SZN7-Trophy-2ND-PLACE-XP", //425
    "Aavegotchi-RF-SZN7-Trophy-3RD-PLACE-RARITY", //426
    "Aavegotchi-RF-SZN7-Trophy-3RD-PLACE-KINSHIP", //427
    "Aavegotchi-RF-SZN7-Trophy-3RD-PLACE-XP", //428

    "Aavegotchi-RF-SZN7-Baadge-TOP-RAANKED-PLAAYER", //429
    "Aavegotchi-RF-SZN7-Baadge-TOP-10-RARITY", //430
    "Aavegotchi-RF-SZN7-Baadge-TOP-10-KINSHIP", //431
    "Aavegotchi-RF-SZN7-Baadge-TOP-10-XP", //432
    "Aavegotchi-RF-SZN7-Baadge-TOP-100-RARITY", //433
    "Aavegotchi-RF-SZN7-Baadge-TOP-100-KINSHIP", //434
    "Aavegotchi-RF-SZN7-Baadge-TOP-100-XP", //435
  ];
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

  //do raanked baadges amount check
  const totalPlayers = await assertBaadgeQuantities(
    itemTypes,
    rarityArray,
    kinshipArray,
    xpArray
  );

  //Upload SVGs
  let ids: number[] = [];
  for (let i = 420; i <= 435; i++) {
    ids.push(i);
  }
  let upload = await updateBaadgeTaskForSvgType(baadges, "sZN7Baadges", ids);

  await run("updateSvgs", upload);

  //Mint baadge item types
  let mint = await mintSvgTaskForBaadges("rfSzn7Bdgs");

  console.log("mint:", mint);
  await run("mintBaadgeSvgs", mint);

  //Airdrop

  let tieBreaker = await getGotchisForASeason("7");
  const [rarityBreaker, kinshipBreaker, xpBreaker] = tieBreaker;
  const rarityRFSzn6 = rankIds(rarityArray, rarityBreaker).map((x) =>
    Number(x)
  );
  const xpRFSzn6 = await rankIds(xpArray, xpBreaker).map((x) => Number(x));
  const kinshipRFSzn6 = await rankIds(kinshipArray, kinshipBreaker).map((x) =>
    Number(x)
  );

  //airdrop all baadges except raanked
  await airdropBaadges(itemTypes, [rarityRFSzn6, kinshipRFSzn6, xpRFSzn6]);

  //airdrop ranked
  // await airdropRaankedBaadges(itemTypes, totalPlayers);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))

    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
