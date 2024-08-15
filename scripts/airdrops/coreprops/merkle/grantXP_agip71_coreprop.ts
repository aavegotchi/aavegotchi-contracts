import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xb8418b96099bc828a60aecf39b92f6d4c3f87a0a897c8bd5c85f0929798df967";

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
