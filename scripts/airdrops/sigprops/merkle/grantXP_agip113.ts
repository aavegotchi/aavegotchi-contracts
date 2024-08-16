import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x212d3baf686a5903de904f1ae41995e9caedf7b490ec511bb67636c362c77151";

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
