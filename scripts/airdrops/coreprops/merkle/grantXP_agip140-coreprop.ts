import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x3413724d3b8ae64d610a64cd9479f1733400e0246c8c852bc889561d994bc5fc";

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
