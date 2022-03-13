import { run } from "hardhat";
import { updateBaadgeTaskForSvgType } from "../../scripts/svgHelperFunctions";

async function main() {
  const ids = [290];

  const fix = await updateBaadgeTaskForSvgType(
    ["Aavegotchi-RF-SZN2-Baadges-XP-ROOKIE-T100"],
    "baadges",
    ids
  );

  await run("updateSvgs", fix);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.xpRookT100Fix = main;
