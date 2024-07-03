import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x2561da8b465ad0b7542e89fa6101ce38c828d505910593c3b576ef2a867e9bc1";

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
