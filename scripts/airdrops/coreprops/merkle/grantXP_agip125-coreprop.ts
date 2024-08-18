import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xf8f9b32ce931aa8d3ae6279fb78f1de87737cdb64d2fb8dbc5adc19df2ebf722";

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
