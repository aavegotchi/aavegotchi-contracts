import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x8852af28d47a02097b7e9510b87d785bc1984813b4b474f8e8ad57b6b7b568be";

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
