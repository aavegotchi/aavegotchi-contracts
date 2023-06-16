import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xa749417f53627cc60140332e3c9e37fbb2779b50b96e71aff005244e71367a46";

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
