import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x8ef0d1bbe2fe75fb2304bfb6aea126db26a5300fb8a332680b603edcf7af263e";

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
