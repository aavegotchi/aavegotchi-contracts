import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x538e41dc85ec65809b2b072d4ebb7dd4af1c9c973cb09f416300b9cc3d3b588f";

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
