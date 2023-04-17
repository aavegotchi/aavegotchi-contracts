import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x69f0ac4e4dc5c651d56940ba4717fedcf8813743c4f5a27967317a8fb29e69da";

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
