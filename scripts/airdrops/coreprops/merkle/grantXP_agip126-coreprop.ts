import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xb46614973c1f9e244b037788fbb31bc1909ce4bb4a56b85f39c6554a53163c0a";

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
