import { run } from "hardhat";
import { itemTypes } from "../../scripts/addItemTypes/itemTypes/rfSzn2Baadges";
import {
  uploadSvgTaskForBaadges,
  airdropTaskForBaadges,
} from "../../scripts/svgHelperFunctions";
import { UpdateSvgsTaskArgs } from "../../tasks/updateSvgs";
import { baadges } from "../../svgs/rfSzn2BaadgeSvgs";
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
} from "../../scripts/airdrops/airdropTokenIdArrays";

async function main() {
  let items = await uploadSvgTaskForBaadges(
    itemTypes,
    "rfSzn2Baadges",
    "rfSzn2BaadgeSvgs"
  );

  for (let index = 0; index < items.length; index++) {
    await run("addBaadgeSvgs", items[index]);
  }

  const kinship1ST: number[] = [kinship[0]];
  const kinship2ND: number[] = [kinship[1]];
  const kinship3RD: number[] = [kinship[2]];
  const xp1ST: number[] = [xp[0]];
  const xp2ND: number[] = [xp[1]];
  const xp3RD: number[] = [xp[2]];
  let top10RookKinAirdrop = await airdropTaskForBaadges(
    [itemTypes[0]],
    topTenRookKin
  );
  // await run("airdropBaadges", top10RookKinAirdrop[0]);
  let xp1STAirdrop = await airdropTaskForBaadges([itemTypes[21]], [xp[0]]);
  await run("airdropBaadges", xp1STAirdrop[0]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
