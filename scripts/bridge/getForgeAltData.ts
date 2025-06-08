import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { ADDRESSES, FORGE_OUTPUT_DIR } from "./constants";

import fs from "fs";
import path from "path";

interface ForgeAltData {
  alloyCosts: { rarityScoreModifier: BigNumber[]; alloyCosts: BigNumber[] };
  essenceCosts: { rarityScoreModifier: BigNumber[]; essenceCosts: BigNumber[] };
  timeCosts: { rarityScoreModifier: BigNumber[]; timeCosts: BigNumber[] };
  skillPoints: { rarityScoreModifier: BigNumber[]; skillPoints: BigNumber[] };
  smeltingSkillPointReductionFactorBips: BigNumber;
  gotchiSmithingSkillPoints: {
    gotchiId: BigNumber[];
    skillPoints: BigNumber[];
  };
  geodeWinChanceMultiTierBips: {
    geodeRarity: BigNumber[];
    prizeRarity: BigNumber[];
    winChances: BigNumber[];
  };
  geodeRarities: BigNumber[];
  geodePrizes: {
    tokenIds: BigNumber[];
    quantities: BigNumber[];
  };
}

const data: ForgeAltData = {
  alloyCosts: { rarityScoreModifier: [], alloyCosts: [] },
  essenceCosts: { rarityScoreModifier: [], essenceCosts: [] },
  timeCosts: { rarityScoreModifier: [], timeCosts: [] },
  skillPoints: { rarityScoreModifier: [], skillPoints: [] },
  smeltingSkillPointReductionFactorBips: BigNumber.from(0),
  gotchiSmithingSkillPoints: { gotchiId: [], skillPoints: [] },
  geodeWinChanceMultiTierBips: {
    geodeRarity: [],
    prizeRarity: [],
    winChances: [],
  },
  geodeRarities: [],
  geodePrizes: { tokenIds: [], quantities: [] },
};

async function getForgeAltData() {
  const forgeDiamond = await ethers.getContractAt(
    "ForgeViewsFacet",
    ADDRESSES.forgeDiamond
  );
  const forgeDAOFacet = await ethers.getContractAt(
    "ForgeDAOFacet",
    ADDRESSES.forgeDiamond
  );

  //get rarity score modifiers
  const alloyCosts = await forgeDiamond.getAllForgeAlloyCost();
  const essenceCosts = await forgeDiamond.getAllForgeEssenceCost();
  const timeCosts = await forgeDiamond.getAllForgeTimeCostInBlocks();
  const skillPoints =
    await forgeDiamond.getAllForgeSkillPointsEarnedFromForge();
  const smeltingSkillPointReductionFactorBips =
    await forgeDiamond.getSmeltingSkillPointReductionFactorBips();
  const geodeWinChanceMultiTierBip =
    await forgeDiamond.getAllGeodeWinChanceMultiTierBips();
  const geodeRarities = await forgeDiamond.getAllGeodeRarities();
  const geodePrizes = await forgeDAOFacet.getGeodePrizesRemaining();
  //we have 25k gotchis max, most of them don't have smithing skill points
  //fetch for 1000 at a time
  const batchSize = 1000;
  const totalGotchiIds = 25000;
  const allGotchiSmithingSkillPoints: {
    gotchiId: BigNumber[];
    skillPoints: BigNumber[];
  } = {
    gotchiId: [],
    skillPoints: [],
  };
  const batches = Math.ceil(totalGotchiIds / batchSize);
  for (let i = 0; i < batches; i++) {
    const batchGotchiIds = Array.from(
      { length: batchSize },
      (_, j) => i * batchSize + j
    );
    const batchGotchiIdsBigNumber = batchGotchiIds.map((id) =>
      BigNumber.from(id)
    );
    const batch = await forgeDiamond.batchGetGotchiSmithingSkillPoints(
      batchGotchiIdsBigNumber
    );
    allGotchiSmithingSkillPoints.gotchiId.push(...batchGotchiIdsBigNumber);
    allGotchiSmithingSkillPoints.skillPoints.push(...batch);
  }

  //look through allGotchiSmithingSkillPoints and remove all gotchiIds that have a skill point of 0
  const nonZeroSkillPoints = allGotchiSmithingSkillPoints.skillPoints
    .map((skillPoint, index) => ({ skillPoint, index }))
    .filter(({ skillPoint }) => Number(skillPoint) > 0);

  allGotchiSmithingSkillPoints.gotchiId = nonZeroSkillPoints.map(
    ({ index }) => allGotchiSmithingSkillPoints.gotchiId[index]
  );
  allGotchiSmithingSkillPoints.skillPoints = nonZeroSkillPoints.map(
    ({ skillPoint }) => skillPoint
  );

  console.log(
    `fetched ${allGotchiSmithingSkillPoints.gotchiId.length} gotchi smithing skill points`
  );

  const rarityScoreModifiersBigNumber = alloyCosts.rarityScoreModifiers.map(
    (rarityScoreModifier) => BigNumber.from(rarityScoreModifier)
  );

  data.alloyCosts.rarityScoreModifier = rarityScoreModifiersBigNumber;
  data.alloyCosts.alloyCosts = alloyCosts.alloyCosts;

  data.essenceCosts.rarityScoreModifier = rarityScoreModifiersBigNumber;
  data.essenceCosts.essenceCosts = essenceCosts.essenceCosts;

  data.timeCosts.rarityScoreModifier = rarityScoreModifiersBigNumber;
  data.timeCosts.timeCosts = timeCosts.timeCosts;

  data.skillPoints.rarityScoreModifier = rarityScoreModifiersBigNumber;
  data.skillPoints.skillPoints = skillPoints.skillPoints;

  data.smeltingSkillPointReductionFactorBips =
    smeltingSkillPointReductionFactorBips;

  data.geodeWinChanceMultiTierBips.geodeRarity =
    geodeWinChanceMultiTierBip.geodeRarities.map((r) => BigNumber.from(r));
  data.geodeWinChanceMultiTierBips.prizeRarity =
    geodeWinChanceMultiTierBip.prizeRarities.map((r) => BigNumber.from(r));
  data.geodeWinChanceMultiTierBips.winChances =
    geodeWinChanceMultiTierBip.winChances.map((c) => BigNumber.from(c));

  data.geodeRarities = geodeRarities;

  data.gotchiSmithingSkillPoints = allGotchiSmithingSkillPoints;
  data.geodePrizes.tokenIds = geodePrizes[0];
  data.geodePrizes.quantities = geodePrizes[1];

  //write to file
  fs.writeFileSync(
    path.join(FORGE_OUTPUT_DIR, "forgeAltData.json"),
    JSON.stringify(data, null, 2)
  );
}

if (require.main === module) {
  getForgeAltData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
