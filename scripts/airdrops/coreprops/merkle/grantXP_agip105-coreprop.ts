import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x7a2767fdecf22ff48fe0cc200c5a4018c8950ab7dbdee8b8f39135bd63733d5f";

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
