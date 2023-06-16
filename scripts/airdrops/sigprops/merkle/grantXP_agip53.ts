import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x894039351d89063285281b2d941c7b5ffc2dcde5899b981785843fe7bc3eb37c";

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
