import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x9ea87c07638280312a87f9e59f795710bd982e44214b5d796e9502bc3362e4e8";

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
