import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x5e4b482614bf859199ef9134e3e8efaefe39047d4f1b48cd2750c4bb8374a0a0";

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
