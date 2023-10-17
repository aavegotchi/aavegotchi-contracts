import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x3b8609c0632f23ea329f97d7c1de18f84313158aabd173f285c8494285636380";

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
