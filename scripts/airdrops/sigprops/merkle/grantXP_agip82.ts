import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x5bd52de503a1514c3004398d78db59df3c33839c468d5df95b10826e5c67cd9d";

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
