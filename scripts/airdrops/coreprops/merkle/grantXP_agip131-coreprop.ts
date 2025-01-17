import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x00942985e9dd86bfc0362e25a83611d9854a81f2d1d75392db185440f764c405";

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
