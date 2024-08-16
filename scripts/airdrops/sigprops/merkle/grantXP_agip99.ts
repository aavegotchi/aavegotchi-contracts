import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x0e3aab22b79d92dedc7b0f1c2ee4d405f10dc79cb55719f3540daf38d04febd0";

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
