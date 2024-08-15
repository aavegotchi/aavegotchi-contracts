import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x8a3fcec5a5f4686d805dd7995279d4a62723238c4e8198673cbff204fd578b4a";

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
