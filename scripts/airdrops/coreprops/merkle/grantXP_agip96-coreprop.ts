import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x4fec11f6ee6c58dc3caa0face6d4894ac1704e63a18be5c9da25b259bac84eb1";

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
