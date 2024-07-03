import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xf450366e0d33ce08c2c86e16b7463b6a1696849893dc6ffb8f00fdf40118d803";

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
