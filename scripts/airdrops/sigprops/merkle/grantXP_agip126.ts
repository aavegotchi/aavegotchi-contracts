import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xc07a34474c3b92c0472479a7570eb743c470af14eb485fa2a841d2b0869b7044";

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
