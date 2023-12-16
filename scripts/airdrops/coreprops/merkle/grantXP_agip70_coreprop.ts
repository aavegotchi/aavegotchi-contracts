import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x41c9e422c666c17d1961f7b210f9fa0278e6729f1a61e70a0719623c334abac6";

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
