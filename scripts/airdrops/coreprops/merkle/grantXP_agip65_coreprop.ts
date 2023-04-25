import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xdae48a92f83f8317dac11e1f28475ce38f6cf9b1986695b6d229e50ca24c03ea";

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
