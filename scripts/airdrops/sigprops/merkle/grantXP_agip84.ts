import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xb78e62609b02040049c304fb9f0d745a49b32b62a239a965c14ea07263019f0f";

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
