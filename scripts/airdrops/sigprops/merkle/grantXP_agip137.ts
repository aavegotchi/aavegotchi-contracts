import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xb628be6b12c543d3ef50182716921ad375186429063909136a1d1129676755d6";

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
