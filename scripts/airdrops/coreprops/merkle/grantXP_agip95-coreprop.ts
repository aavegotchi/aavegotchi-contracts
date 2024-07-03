import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x47a9ce6f103047d8cb10ca14cd7274cd8d13871080e32cbe0b4efedf6e0b888c";

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
