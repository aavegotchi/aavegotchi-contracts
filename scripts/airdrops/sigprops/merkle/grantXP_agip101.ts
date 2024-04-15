import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x782d1fe91e144788819da2d6c965a1d58aa0e670f2f1bc7a501429b823c9b4a8";

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
