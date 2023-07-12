import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x311efd4b571ade64041f1859adede6511aaefaf9e9380a7895b5fd7b3680694d";

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
