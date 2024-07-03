import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xfcdb672f451ae4a2cdb7827ca8a686ed57027e977585bc1e30f46c6b8081eb0e";

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
