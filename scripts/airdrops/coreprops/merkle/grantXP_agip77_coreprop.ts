import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xbf227c513737067b8e3aeb66eecfeb18d52129ac701317ca21c0a1d3ba7181e9";

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
