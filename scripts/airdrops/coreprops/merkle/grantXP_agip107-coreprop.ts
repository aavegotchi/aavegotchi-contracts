import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xd80bddef82f5543ff581139ef060e9571fcf2825df15e7bda7f740cddc6c8459";

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
