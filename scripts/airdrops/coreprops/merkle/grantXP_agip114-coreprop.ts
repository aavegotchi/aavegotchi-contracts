import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x1470e49097b506d8aa9f017f1fd13328f456cba790c8df48bc789375c6cd723a";

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
