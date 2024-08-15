import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x42da17ccfaf9c99bd5a904de5a9d1f1d72f8e7057594fbd20f9d328ad6b8a109";

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
