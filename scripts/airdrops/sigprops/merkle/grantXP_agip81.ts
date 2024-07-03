import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xa816498852ce504a6211102987466964d3bb4a944bcd6484afebdc76dd5c5172";

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
