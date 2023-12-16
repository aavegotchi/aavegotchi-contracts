import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x9c4951fcf5371ca2641b7db5ea4d31b64aac4f1f3dbcbc7c7f68a5889ea4b577";

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
