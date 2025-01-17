import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x272bea39a5f2e13a5afc65d7c9e70ffb5a9da06d4b6d169eb7a0d72aab10b7cf";

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
