import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x2ab8f9ec193623518f69cbdf31c3c945a03af82bcac03300f927ec87149c0782";

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
