import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x307f6d8e39de3ce35886714e07586f838d42aa0556c66b19a142b1d8f2ba1703";

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
