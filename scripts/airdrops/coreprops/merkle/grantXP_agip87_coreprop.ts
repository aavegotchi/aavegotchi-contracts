import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x929b6df24a265c0b7ea7e6a4f49eac4f1852993c3c9be69ef38f07f8a462923e";

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
