import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x4fcf6ce9107b62231a92c3c3bed6a5806732b37e5da443883d4f8e5a5286177e";

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
