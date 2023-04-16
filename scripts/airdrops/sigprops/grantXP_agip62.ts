import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x6fd66b330df28c8ca3fab19da85d632be22a3dc393ae468bee6e9e88fa248b25";

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
