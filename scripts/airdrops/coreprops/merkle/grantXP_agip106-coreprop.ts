import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x4c05f8411850c2155c423417c6ce554e1750a04d31ec1b9bf85b716d46a50745";

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
