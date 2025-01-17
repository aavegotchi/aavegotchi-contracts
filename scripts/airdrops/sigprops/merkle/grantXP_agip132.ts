import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x094419732ba0037d626f90c99b65c9810b4a3627eaf41f30cda6ca334e390b24";

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
