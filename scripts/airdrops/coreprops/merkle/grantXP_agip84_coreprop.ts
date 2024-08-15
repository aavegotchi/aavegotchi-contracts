import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x0a5b7e0c7fb2137cfcb5a546c27f5ddcef066631e79b9d77d1b16e3a501f9e2f";

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
