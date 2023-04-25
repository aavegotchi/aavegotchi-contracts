import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x1dcc158c82df2e95f977ff5853c6dc9ff9a96ccfb2a5f70c30b7c20d75d0346f";

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
