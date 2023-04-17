import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xc6622d08b9786e543699695b422c361d2bf6ed1d4395d9e365dd70d8301d440b";

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
