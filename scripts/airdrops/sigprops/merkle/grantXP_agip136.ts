import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xb8578f9d94434cf536f0fdbce6d1baec26fafeba78c10129d955dadeeeba12ad";

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
