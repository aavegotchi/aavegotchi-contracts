import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xce481514fa4f8c08b1384a2fdec32cf4b90fb24bedcf834cbf1e87ddafac418f";

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
