import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x09bccefc981f6dad5e8f96045a57d6abe06685cf2572f75bf0444eb0c8253660";

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
