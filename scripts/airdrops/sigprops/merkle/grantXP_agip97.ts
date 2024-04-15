import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xb5f59d03cc0e0db509357d4a80f368af1ae6567cd1c57240c251cb1107da56b2";

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
