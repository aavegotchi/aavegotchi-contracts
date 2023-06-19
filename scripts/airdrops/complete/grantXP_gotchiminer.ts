import { run } from "hardhat";
import { GrantXPMinigameTaskArgs } from "../../../tasks/grantXP_minigame";

async function grantXP() {
  const taskArgs: GrantXPMinigameTaskArgs = {
    filename: "gotchiminer.ts",
    xp15: "100",
    xp10: "400",
    xpMin: "10000",
  };
  await run("grantXP_minigame", taskArgs);
}

grantXP()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.grantXP = grantXP;
