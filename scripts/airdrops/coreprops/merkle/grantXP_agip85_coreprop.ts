import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x00c00dc576a8729214934ecf329ef86c4a78428111b030af6fa49a60807c973b";

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
