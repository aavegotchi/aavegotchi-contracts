import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xc77a15f4e715fc9118334e50aec61546332be0011fed3740e20c8f71375b2e57";

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
