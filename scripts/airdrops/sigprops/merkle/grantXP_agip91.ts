import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x0146fc3a188544b270dd5efc928f3d96e31a9d00bfc6a367fa77c8124bd4df93";

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
