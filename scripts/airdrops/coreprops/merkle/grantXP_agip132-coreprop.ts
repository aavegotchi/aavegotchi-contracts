import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x4c1529a8fd0385d793838bd4d997aab84b2eb0f8344f941e2fab906ee5172308";

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
