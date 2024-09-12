import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xe815c428df8f4e6933c7e04586c1e4b0add22924d4f77e4b067f89ff4bd3f207";

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
