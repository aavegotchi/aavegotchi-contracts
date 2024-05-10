import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xe2536a75bf80798f65559eeb832312198d9a9c640b5660f432e1e71de60dd945";

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
