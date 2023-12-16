import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x3b80a83886c8648168d2d9451dae55d01ceeb5f016fd3d7f6133bbf53de04b3b";

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
