import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x368446c881fbea341027014c1aba0004f33af0d2eb769a1a99ad86a665ffeedb";

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
