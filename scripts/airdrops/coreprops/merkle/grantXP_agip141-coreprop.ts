import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x2edea7d431755c64cacbd2727a49eee1951ef06051fadc1c3f88cd951e89d4a2";

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
