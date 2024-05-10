import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xce52040a02927a460303484c408f10ac0405a2c4bb3ffa1a0262ab5b42f9df44";

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
