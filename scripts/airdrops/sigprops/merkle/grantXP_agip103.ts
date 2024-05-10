import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x1607f167c1f4f1dc9e817c7da387886655e39c8982f25423ce8ad8d90d82c10e";

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
