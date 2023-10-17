import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xae17b512c7055fb2fa0ae2701666c417ebe2c80bc2901eda93d80239a9ca5c53";

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
