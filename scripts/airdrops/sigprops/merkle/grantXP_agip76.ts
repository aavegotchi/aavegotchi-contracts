import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x3aaf1baf461192154a33bd41863e0675341599c45a7a1223d6a1008d6c3f8dda";

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
