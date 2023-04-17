import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x16f6d4043da35ef318a9071e701e905adab8fe3928c2584880aae786c2357eb3";

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
