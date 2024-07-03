import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x2d8df1e8ad91c9b928e9d0c319e8cabfef103e48fbc7a8933d889b1389a17873";

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
