import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x25c0def94d5fb016fb39ac823755dd2de447bd5de609d25cc108f182391ddcda";

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
