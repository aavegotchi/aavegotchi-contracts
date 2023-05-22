import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x4c43e12bf5d84d049e907194c48f514e1efacb6ec1f1c5c742d0530a86df021a";

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
