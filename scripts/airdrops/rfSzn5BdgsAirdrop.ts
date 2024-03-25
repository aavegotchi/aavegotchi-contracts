import {
  updateBaadgeTaskForSvgType,
  mintSvgTaskForBaadges,
} from "../../scripts/svgHelperFunctions";

import {
  rankIds,
  getPlaayersIds,
  hasDuplicateGotchiIds,
} from "../../scripts/helperFunctions";
import { itemTypes } from "../../scripts/addItemTypes/itemTypes/rfSzn5Bdgs";

import { dataArgs as dataArgs1 } from "../../data/airdrops/rarityfarming/szn5/rnd1";
import { dataArgs as dataArgs2 } from "../../data/airdrops/rarityfarming/szn5/rnd2";
import { dataArgs as dataArgs3 } from "../../data/airdrops/rarityfarming/szn5/rnd3";
import { dataArgs as dataArgs4 } from "../../data/airdrops/rarityfarming/szn5/rnd4";
import { getGotchisForASeason } from "../getGotchis";
import { airdropBaadges, assertBaadgeQuantities } from "./baadgeHelpers";

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
  for (let i = 388; i <= 403; i++) {
    ids.push(i);
  }
  let upload = await updateBaadgeTaskForSvgType(baadges, "sZN5Baadges", ids);
  //await run("updateSvgs", upload);

  //Mint baadge item types
  let mint = await mintSvgTaskForBaadges("rfSzn5Bdgs");
  console.log("mint:", mint);
  //await run("mintBaadgeSvgs", mint);

  //Airdrop

  const [rarityBreaker, kinshipBreaker, xpBreaker] = await getGotchisForASeason(
    "5"
  );

  const rarityRFSzn5 = rankIds(rarityArray, rarityBreaker).map((x) =>
    Number(x)
  );
  const xpRFSzn5 = await rankIds(xpArray, xpBreaker).map((x) => Number(x));
  const kinshipRFSzn5 = await rankIds(kinshipArray, kinshipBreaker).map((x) =>
    Number(x)
  );

  //airdrop all baadges except raanked
  await airdropBaadges(itemTypes, [rarityRFSzn5, kinshipRFSzn5, xpRFSzn5]);

  //send out raanked baadges
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
