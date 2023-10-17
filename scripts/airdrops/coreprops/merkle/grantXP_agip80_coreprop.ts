import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x19110d25764ffa927cbfc41297fd4c55f35d33a85c805f1cecc6326760f1b6bf";

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
