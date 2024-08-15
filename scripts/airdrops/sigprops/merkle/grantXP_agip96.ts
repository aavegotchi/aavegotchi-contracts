import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x12136b11853cdc116af694d23e83190481119fb7e71048d2fc4ef160d3c0c32b";

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
