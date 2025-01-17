import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x1df75275fb195fc6f1cac6c6830a96558b381049ab4519be7ac8720df12dd9a1";

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
