import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xade68c6cf0285a55e4cf914266761b9a505389ef4686e7972ad5426ac49cd238";

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
