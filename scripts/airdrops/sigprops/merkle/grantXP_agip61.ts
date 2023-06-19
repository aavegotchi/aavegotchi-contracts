import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x711c79d517b315b252e90cb6cf7a22e9291c5e052370b2582e4979cf55f055e9";

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
