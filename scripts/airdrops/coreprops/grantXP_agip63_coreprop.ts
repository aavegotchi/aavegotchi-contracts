import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xfb622fe34ebf295d55d6d9a44d6da55176861f24c8d9393af7838cae393e6f7f";

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
