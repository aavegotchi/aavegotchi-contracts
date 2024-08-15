import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x24e31f35168d1cc999288a38c012880c6ad4d41e604d66d1bbe4b67a00562990";

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
