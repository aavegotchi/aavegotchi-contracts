import { run } from "hardhat";
import {
  updateSvgTaskForSvgType,
  updateSleevesTaskForSvgType,
} from "../../scripts/svgHelperFunctions";

async function main() {
  const ids = [105];
  const sleeveIds = [18];

  const body = await updateSvgTaskForSvgType(ids, "front");
  const sleeves = await updateSleevesTaskForSvgType(ids, sleeveIds, "front");

  // console.log("Body: ", body);
  // console.log("Sleeves: ", sleeves);

  await run("updateSvgs", body);
  await run("updateSvgs", sleeves);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.sleevePxlBrkFix = main;
