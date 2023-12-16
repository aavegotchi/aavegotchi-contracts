import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xb07be37d556302c873bee9b232c8a54d5ab8925af72ce9f38828e91fdb6ab5a4";

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
