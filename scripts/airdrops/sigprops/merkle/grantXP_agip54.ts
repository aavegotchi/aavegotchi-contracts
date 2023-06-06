import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x0e2211f4b37efd7dc38710aa13a1b8e7411998a8f53cd872fc0ddd6ed7996ac0";

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
