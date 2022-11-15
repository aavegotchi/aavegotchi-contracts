import { run } from "hardhat";
import { updateBaadgeTaskForSvgType } from "../svgHelperFunctions";

async function main() {
  const lastNumber: number = 292;
  const ids: number[] = [];

  for (let i = 265; i < lastNumber; i++) {
    ids.push(i);
  }

  const fileNames: string[] = [
    "Aavegotchi-RF-SZN2-Trophy-RARITY-1ST",
    "Aavegotchi-RF-SZN2-Trophy-KINSHIP-1ST",
    "Aavegotchi-RF-SZN2-Trophy-XP-1ST",
    "Aavegotchi-RF-SZN2-Trophy-RARITY-2ND",
    "Aavegotchi-RF-SZN2-Trophy-KINSHIP-2ND",
    "Aavegotchi-RF-SZN2-Trophy-XP-2ND",
    "Aavegotchi-RF-SZN2-Trophy-RARITY-3RD",
    "Aavegotchi-RF-SZN2-Trophy-KINSHIP-3RD",
    "Aavegotchi-RF-SZN2-Trophy-XP-3RD",
    "Aavegotchi-RF-SZN2-Baadges-PLAAYER-RAANKED",
    "Aavegotchi-RF-SZN2-Baadges-ROOKIE-OF-THE-YEAR",
    "Aavegotchi-RF-SZN2-Trophy-KINSHIP-ROOKIE-1ST",
    "Aavegotchi-RF-SZN2-Trophy-XP-ROOKIE-1ST",
    "Aavegotchi-RF-SZN2-Trophy-KINSHIP-ROOKIE-2ND",
    "Aavegotchi-RF-SZN2-Trophy-XP-ROOKIE-2ND",
    "Aavegotchi-RF-SZN2-Trophy-KINSHIP-ROOKIE-3RD",
    "Aavegotchi-RF-SZN2-Trophy-XP-ROOKIE-3RD",
    "Aavegotchi-RF-SZN2-Baadges-RARITY-T10",
    "Aavegotchi-RF-SZN2-Baadges-KINSHIP-T10",
    "Aavegotchi-RF-SZN2-Baadges-XP-T10",
    "Aavegotchi-RF-SZN2-Baadges-RARITY-T100",
    "Aavegotchi-RF-SZN2-Baadges-KINSHIP-T100",
    "Aavegotchi-RF-SZN2-Baadges-XP-T100",
    "Aavegotchi-RF-SZN2-Baadges-XP-ROOKIE-T10",
    "Aavegotchi-RF-SZN2-Baadges-KINSHIP-ROOKIE-T10",
    "Aavegotchi-RF-SZN2-Baadges-XP-ROOKIE-T100",
    "Aavegotchi-RF-SZN2-Baadges-KINSHIP-ROOKIE-T100",
  ];

  console.log("Ids length: ", ids.length);
  console.log("File names length: ", fileNames.length);

  const fix = await updateBaadgeTaskForSvgType(fileNames, "baadges", ids);

  await run("updateSvgs", fix);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.xpRookT100Fix = main;
