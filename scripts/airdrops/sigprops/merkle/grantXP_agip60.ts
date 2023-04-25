import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xd32d9f40f79c98b69761a9f09f8de0f28a8ec005cc0f01a7f4c9ea3ee8f2e1dc";

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

exports.grantXP = addXPDrop;
