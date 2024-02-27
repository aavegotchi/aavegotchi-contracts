import { itemTypes } from "../../scripts/addItemTypes/itemTypes/rfSzn6Bdgs";

import { rankIds } from "../../scripts/helperFunctions";

import { dataArgs as dataArgs1 } from "../../data/airdrops/rarityfarming/szn6/rnd1";
import { dataArgs as dataArgs2 } from "../../data/airdrops/rarityfarming/szn6/rnd2";
import { dataArgs as dataArgs3 } from "../../data/airdrops/rarityfarming/szn6/rnd3";
import { dataArgs as dataArgs4 } from "../../data/airdrops/rarityfarming/szn6/rnd4";
import { getGotchisForASeason } from "../getGotchis";
import { airdropBaadges, assertBaadgeQuantities } from "./baadgeHelpers";
import {
  updateBaadgeTaskForSvgType,
  mintSvgTaskForBaadges,
} from "../svgHelperFunctions";
import { run } from "hardhat";

export async function main() {
  const baadges: string[] = [
    "Aavegotchi-RF-SZN6-Trophy-1ST-PLACE-RARITY", //404
    "Aavegotchi-RF-SZN6-Trophy-1ST-PLACE-KINSHIP", //405
    "Aavegotchi-RF-SZN6-Trophy-1ST-PLACE-XP", //406
    "Aavegotchi-RF-SZN6-Trophy-2ND-PLACE-RARITY", //407
    "Aavegotchi-RF-SZN6-Trophy-2ND-PLACE-KINSHIP", //408
    "Aavegotchi-RF-SZN6-Trophy-2ND-PLACE-XP", //409
    "Aavegotchi-RF-SZN6-Trophy-3RD-PLACE-RARITY", //410
    "Aavegotchi-RF-SZN6-Trophy-3RD-PLACE-KINSHIP", //411
    "Aavegotchi-RF-SZN6-Trophy-3RD-PLACE-XP", //412

    "Aavegotchi-RF-SZN6-Baadge-TOP-RAANKED-PLAAYER", //413
    "Aavegotchi-RF-SZN6-Baadge-TOP-10-RARITY", //414
    "Aavegotchi-RF-SZN6-Baadge-TOP-10-KINSHIP", //415
    "Aavegotchi-RF-SZN6-Baadge-TOP-10-XP", //416
    "Aavegotchi-RF-SZN6-Baadge-TOP-100-RARITY", //417
    "Aavegotchi-RF-SZN6-Baadge-TOP-100-KINSHIP", //418
    "Aavegotchi-RF-SZN6-Baadge-TOP-100-XP", //419
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
  await assertBaadgeQuantities(itemTypes, rarityArray, kinshipArray, xpArray);

  //Upload SVGs
  let ids: number[] = [];
  for (let i = 404; i <= 419; i++) {
    ids.push(i);
  }
  let upload = await updateBaadgeTaskForSvgType(baadges, "sZN6Baadges", ids);
  await run("updateSvgs", upload);

  //Mint baadge item types
  let mint = await mintSvgTaskForBaadges("rfSzn6Bdgs");

  await run("mintBaadgeSvgs", mint);

  //Airdrop

  let tieBreaker = await getGotchisForASeason("6");
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
  //  await airdropRaankedBaadges(itemTypes, totalPlaayers);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))

    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
