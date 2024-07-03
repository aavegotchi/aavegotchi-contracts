import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x48ed1bfe262897452dbccdada4f280c8c5d2a41150640fb583e3f5df50eb6572";

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
