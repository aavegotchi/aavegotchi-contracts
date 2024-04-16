import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xf483d72d6bc3f6bfe318905211a5a274520695d9af9174f948e65bb8869aea82";

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
