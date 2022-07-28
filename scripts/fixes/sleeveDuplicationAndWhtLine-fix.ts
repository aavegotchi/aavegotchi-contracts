//Duplicate sleeves fix:
//          46(half rekt shirt), 50(gldnXross robe), 54(lama corn shirt),
//          105(portal mage), 109(rasta shirt), 115(blue hawaiian shirt),
//          56(aagent shirt), 91(pajama shirt)
//White line in sleeve fix:
//          105(portal mage),

import { run } from "hardhat";
import {
  updateSvgTaskForSvgType,
  updateSleevesTaskForSvgType,
} from "../svgHelperFunctions";

async function main() {
  const ids = [46, 50, 54, 56, 91, 105, 109, 115];
  const sleeveIds = [18];

  const body = await updateSvgTaskForSvgType(ids, "front");
  const sleeves = await updateSleevesTaskForSvgType(sleeveIds, "front");

  await run("updateSvgs", body);
  await run("updateSvgs", sleeves);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.sleeveDuplicationAndWhtLineFix = main;
