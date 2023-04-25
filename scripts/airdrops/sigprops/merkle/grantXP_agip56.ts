import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x0e51eab4886527f297d8470f0434e502032be7368d69a2f71ac06057e193ebec";

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
