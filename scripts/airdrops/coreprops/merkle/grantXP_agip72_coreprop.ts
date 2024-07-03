import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x7fe819f1bba47d2322d4bb1f1b796a3a13c96146ac90dba5f3ef436b10323aba";

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
