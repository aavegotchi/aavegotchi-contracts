import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x04a70afb2d93046600ae74a24926ac34161902e24c336aac705dbee7683880e1";

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
