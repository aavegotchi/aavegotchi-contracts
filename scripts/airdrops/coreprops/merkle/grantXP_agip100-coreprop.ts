import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xd26cce5529ae0bf5bdba4c17d3a9a39c823c186c86ed3805ad9fc1876d14bd87";

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
