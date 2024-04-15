import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xc4a9034b518ae0ba34181e3f835fa1f525efbf9bc1172b2cdd3fac7bfda5599e";

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
