import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x63f270df7ab2b36f638999e76b634baacba041d3e4450616aef56c6fcdb08dcc";

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
