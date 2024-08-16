import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x2585c9a492118092309a0c60738f704129297e4384c7bec47694e02a6448bf94";

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
