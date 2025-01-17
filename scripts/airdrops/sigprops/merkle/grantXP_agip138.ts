import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x677d704fc7059eaf3467f23cde3581ef66096f5f1e8d55dcee54048436ff0566";

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
