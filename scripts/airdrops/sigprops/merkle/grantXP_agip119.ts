import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xfa46eb6789d3230b7a56919aa3902bd835053049ab59e56b04e9185f06abea60";

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
