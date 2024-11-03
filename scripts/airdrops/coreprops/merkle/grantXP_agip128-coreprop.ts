import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x76a91e48a9a1b12852f055be07c2661d3d4a208091db9edbb16ba73b3cef3e55";

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
