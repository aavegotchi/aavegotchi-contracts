import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x59c001336592a05451805f89d66859159a136bfb850aa4263ec962f65134e2de";

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
