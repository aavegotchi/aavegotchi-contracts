import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x4ffa41a2ab80839e03bbc0eaa1d4f8b210f294aad043343809d4f8b36059f11a";

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
