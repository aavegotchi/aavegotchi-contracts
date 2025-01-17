import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x4ccd858c4db0933066a5c41386ffc008d87347fa5b582f23a44c7c47b9a12d27";

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
