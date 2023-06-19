import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x6cabf7712786db0f3a954fe03e84c44a12d4b14aa2fb5243c606607bf6296bf1";

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
