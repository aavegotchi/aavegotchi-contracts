import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x530eb8319bd1cc13d0a86fafb54d1e77547e8899da05326a55f2007ae1ad8883";

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
