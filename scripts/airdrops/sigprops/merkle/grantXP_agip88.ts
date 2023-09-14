import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x451ca91ce0403999fd4b57f14a9f8cc3a62fed001ea148e01dfec0e9bbbb467e";

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
