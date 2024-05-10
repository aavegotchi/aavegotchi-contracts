import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x5fa86c431e3e0d5429906f86d1182781b7f0366f554a57631cf0c8fd2dd1c2b5";

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
