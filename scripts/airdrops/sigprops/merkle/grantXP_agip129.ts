import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x4341932033531173746139ca670c533e6edd795b453075858de2d17457360899";

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
