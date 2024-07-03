import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x2d40a9c545d58a649ac519f74ece7860fa9ca92f7a276db4753b1749c934a190";

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
