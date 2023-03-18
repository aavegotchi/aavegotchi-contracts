import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xda5dc0306f37d55d5a1b61d8ddc3dd3af70bf96377476706514f75198dc98950";

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
