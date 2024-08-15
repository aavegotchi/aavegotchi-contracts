import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xbb7e75512a55d15a6233e13a83af5ce5638c36b5a96e3dde8c4560acf904038a";

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
