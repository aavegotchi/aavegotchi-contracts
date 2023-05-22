import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xf83adaa50a92a963961d07c3547635dd9dfbcf35183bf4cc61a244f6cd1097eb";

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
