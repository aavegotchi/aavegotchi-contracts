import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xcf83de78265ceb5d891bb83e7774962bdb6a320871474b4e6e3e05fece458f54";

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
