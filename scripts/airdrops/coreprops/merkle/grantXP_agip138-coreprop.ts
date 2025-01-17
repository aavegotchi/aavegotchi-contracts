import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x0e447db3aa3734f95b2b30c0fee6cc50dc2b83cec032c83fb65c8fd5e14cad76";

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
