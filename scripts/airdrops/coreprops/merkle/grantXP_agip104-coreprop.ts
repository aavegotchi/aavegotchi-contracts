import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xce4c9735a8c6ba58adc123b6e91fe94c729cf45546db88647ecdb9bf77ebb485";

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
