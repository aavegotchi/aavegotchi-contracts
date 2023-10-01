import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xd46fdc43cf05ad2059c1f1ddd9d129fafcf1a522a4623aaf21438ac6c1672478";

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
