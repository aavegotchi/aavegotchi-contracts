import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x551268ae0158295bfa0e818cac2ddf1356149f1dfbdb9727028f29833b3e53e5";

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
