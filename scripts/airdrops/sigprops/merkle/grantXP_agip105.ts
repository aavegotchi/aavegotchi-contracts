import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xa66c045753435dda2bc8b35e95fe0dbda5087b1665c9ea50e64c82fbf6fdfe26";

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
