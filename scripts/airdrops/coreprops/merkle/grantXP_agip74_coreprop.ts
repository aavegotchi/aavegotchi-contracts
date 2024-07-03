import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x96c8936c66da9ef291e6bbfb2861db523aef347beeb787d0ad4fb01ea1089f89";

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
