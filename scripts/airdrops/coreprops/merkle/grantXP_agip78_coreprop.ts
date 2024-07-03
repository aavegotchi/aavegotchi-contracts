import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xb7b45e605373b2835b92ee570b6aaf06219a1c8042e6a0a467d06c02da17b727";

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
