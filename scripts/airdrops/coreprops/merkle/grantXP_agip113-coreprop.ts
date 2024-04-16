import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x9e2dfd4a35b6069df9c0e29a4d88f197a3a6af816f5275b210a768521c734b97";

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
