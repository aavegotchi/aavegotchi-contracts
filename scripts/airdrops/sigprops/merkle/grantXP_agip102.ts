import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x0486b8e67ca6e62572f46bac263bebb7a5a6e45420d4be33e29e3707dd81f7e6";

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
