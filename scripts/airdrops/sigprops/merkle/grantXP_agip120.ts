import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xad47cd52673adaa683163864fd2c73120186a6086f6b581b0305687eda8d58a3";

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
