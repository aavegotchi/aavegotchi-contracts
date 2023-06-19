import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x35f331772e625d209848a32cc25e84fef06d56cca7d270ff0031dcdeb38f3b4c";

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
