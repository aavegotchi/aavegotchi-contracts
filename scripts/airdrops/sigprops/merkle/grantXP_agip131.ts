import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x8a0f395fe3a966d5d52477d09b6c4e34f6e5053f70a8e65d118901adfc15078f";

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
