import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x42c3aaf8988a5ca32e5cd035847655af6f9acc2141c3cdaa505a877badf66e41";

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
