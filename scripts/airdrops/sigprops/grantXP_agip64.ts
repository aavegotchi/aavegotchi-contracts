import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x0f8ae0b2eebe1eddf0dc7e2c49b07fcec17338101a4a21f5aa48e9bb3f35ef28";

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
