import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x24191cf52ade5500f0292f3b553659424df7c00d0e9945b9efe2807f97e97513";

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
