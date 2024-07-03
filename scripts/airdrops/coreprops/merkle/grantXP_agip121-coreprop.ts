import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xb5441817ecff8a693937ff1c16562c9d1d43c4bbf76490220d7d34da181bb43d";

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
