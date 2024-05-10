import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x21817797ee5a9ec55743cc7899c81ebe9e05ec02c7cd7bd6d5fbd220cd4129e4";

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
