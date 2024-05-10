import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x10aa77a1fb0b348dfd5f40b0643f61d67c31a37129ca5cb0f452bdd951f4cf88";

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
