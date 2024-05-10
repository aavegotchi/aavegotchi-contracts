import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xb009a2990660eee0fb9babd9cbd431340f2188db0b7f6d7fed9203c709729e6b";

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
