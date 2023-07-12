import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x9d2a5cbe986c1c1f30132c3e396470e6b67f7d74ce2afb6a681100ce209d27e0";

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
