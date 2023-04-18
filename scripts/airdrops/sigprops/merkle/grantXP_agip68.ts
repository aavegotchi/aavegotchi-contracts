import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xfecb010001c499cb65a4b5f0c19f729fb1135fadea497f099f3b612a57decb21";

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
