import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xd7de27500ffa8d360848e7655a32a7b7a00ac46fc13ab156ef51dfebb4101d4a";

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
