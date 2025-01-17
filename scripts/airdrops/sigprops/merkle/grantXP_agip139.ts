import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xc5324f9c7a3c0d8298a2ceee89c5457e95dc04cde545d61dc0902ef487055181";

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
