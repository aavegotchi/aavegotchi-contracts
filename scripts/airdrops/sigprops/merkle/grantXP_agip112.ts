import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x9fffad99521c41c1443b9b8501722adbac990e5677bbec9480b2f2c76408a5d4";

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
