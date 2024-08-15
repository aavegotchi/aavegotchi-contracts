import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xa3236a927c8e75bb96d2e69e51015b1689a5425a6394d52b0257eefa38d84b68";

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
