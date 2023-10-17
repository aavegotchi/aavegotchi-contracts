import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xa094958ed44a7905f22b97dc48fc230951b915ede0e0c34017cc8cdc795a30c3";

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
