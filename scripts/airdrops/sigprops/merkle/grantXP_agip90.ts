import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x08ea07c9f1b18cd56c280f82b2467acdd21de6a06a7ab44768f4a13b6a6c0372";

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
