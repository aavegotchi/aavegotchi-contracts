// id - 111 (hazmat hood), 252 (astronaut helmet), 255 (lil bubble helmet)

import { run } from "hardhat";
import { updateSvgTaskForSvgType } from "../../scripts/svgHelperFunctions";

async function main() {
  const ids = [111, 252, 255];

  const fixFront = await updateSvgTaskForSvgType(ids, "front");
  const fixLeft = await updateSvgTaskForSvgType(ids, "left");
  const fixRight = await updateSvgTaskForSvgType(ids, "right");

  await run("updateSvgs", fixFront);
  await run("updateSvgs", fixLeft);
  await run("updateSvgs", fixRight);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.helmetPxlBrkFix = main;
