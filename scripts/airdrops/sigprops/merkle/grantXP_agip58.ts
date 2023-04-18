import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x0a5979a05cebab1c87e08bbe8d142657d3442e0987d45d36c2eb41584d86da7b";

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
