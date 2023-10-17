import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x483f8705d55038ccbcbc20ed723b538034c0f768bda2ec749b2738dafc418940";

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
