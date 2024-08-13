import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xa4a817931adb599979eccec3dbb5e774b224c1d4da2609b532addb2e060f5888";

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
