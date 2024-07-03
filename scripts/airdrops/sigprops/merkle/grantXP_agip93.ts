import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x95c58ed45937af95c94df7bc959381435ea592bfff55355d8c04ed6d5b2727b6";

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
