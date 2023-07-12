import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x28700326fc76752543f263d05770fea9534cff73c107cf8775760bdba9ca1f1e";

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
