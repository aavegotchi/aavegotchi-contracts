import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xff8daa93be9021f9f0a49cb8394ef49f868261bd9828faa351611c9854bbf0db";

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
