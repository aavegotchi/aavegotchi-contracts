import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xc4a1181fa1d6ede81e71c195aab84a21c1431f8a8b28221100e42720b84c2df3";

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
