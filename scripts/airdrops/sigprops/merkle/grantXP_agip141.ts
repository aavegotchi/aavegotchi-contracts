import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xdd05c504c39fa18b6415427777fe96a6079a040deb1b7c7848947223e38e9d88";

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
