import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x2d9a7ecb7a5e503a3fb1b252bbf66a3bc20f07517de83c8043cf36e0954496a4";

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
