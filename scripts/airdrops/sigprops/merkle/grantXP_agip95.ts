import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xded951f11b5b0ef037133c627159aea13acd4a10fe26d509076de5708244a62f";

  await run("deployXPDrop", {
    proposalId: propId,
  });
}

addXPDrop()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
