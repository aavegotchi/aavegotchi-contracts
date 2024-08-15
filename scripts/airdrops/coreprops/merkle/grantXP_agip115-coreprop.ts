import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x62cb52138d0d66f0b363156f0be470d2289f7e64aa0b00a98f09a52ec6e4cba4";

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
