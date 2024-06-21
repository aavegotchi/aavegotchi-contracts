import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xad9c32042678c6250507f602a57ea52846efe8391d781bc9476683e9347bef63";

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
