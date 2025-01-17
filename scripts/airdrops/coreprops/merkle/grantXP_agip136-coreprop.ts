import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x31b5bcf9b37a7ce844e1942b876ff579c800c050eac07b5b0a482005ba59b471";

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
