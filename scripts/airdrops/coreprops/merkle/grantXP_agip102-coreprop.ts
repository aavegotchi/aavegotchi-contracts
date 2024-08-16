import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xac53f22b919be753d98f159df7d5f6883861ecb7c5c47f35b3ebfdec2f6be3c6";

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
