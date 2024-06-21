import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x6f06c1434b218cc1673ee6b34a0e11feefc4db101b291d0057748a287917b2d4";

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
