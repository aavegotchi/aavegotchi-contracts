import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xc0549f5d1bf319645e3835ed4404d8ed6bd364c1f30ca4a60b542ce9a12c56bf";

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
