import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xef468935df62924bbf897d45a92da9876da20e30fdb6d7b7f18c2c847b198b86";

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
