import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x5fdebaefab3fa208fa4662ad1919530a98d4ac494836fb45aa0d46b36bf0498b";

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
