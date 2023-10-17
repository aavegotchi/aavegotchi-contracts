import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x75c2e9cc1472c6d18709ba53653b8e03f863afd8c42e58c5abb48f2d962069c2";

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
