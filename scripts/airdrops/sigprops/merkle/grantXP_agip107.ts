import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x6714bd532f3bca44a2a92c221d3b57f51682c57047f15505a1205493b7ee4cbf";

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
