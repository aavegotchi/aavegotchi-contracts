import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x705c1bd8e3d6a6455241bfb0b236ea2504fc5bf7157a1073245ec01b4bacb62a";

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
