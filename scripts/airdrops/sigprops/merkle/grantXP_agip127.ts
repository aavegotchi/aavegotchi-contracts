import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x41a8eefa0d919e84a6fc6e2ef3b62b776f98deb4627defe310c056e30d091cfc";

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
