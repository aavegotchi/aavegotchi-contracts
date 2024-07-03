import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x9cda0125cd357f78a6f406b0a81f3bf2e2bc0dae3bae0e7e4292ebef86f8861d";

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
