import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x5b328a78c8461910ec5cc9240eb9143efcfcc4a537304c30235d969ffab02ec3";

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
