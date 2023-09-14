import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x5116dcfea59bb27189e607e990746417840142115f31ecb6223a8748868b2a7f";

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
