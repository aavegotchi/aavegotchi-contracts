import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x53725868842a2b7c6e2cf251eaeb5c939b7272c3c849ef3814ac7bc9b62469eb";

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
