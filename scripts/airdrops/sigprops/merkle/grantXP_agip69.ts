import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x9e71af4605d33f57f68ded125ea95da0b766cffa6eb709f2b320b5e095620de2";

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
