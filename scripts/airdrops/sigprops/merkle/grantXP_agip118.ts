import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x63537aa0e51e8f5c52d12b23874ce837c68a3ae78a1528d860797b58af522a2b";

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
