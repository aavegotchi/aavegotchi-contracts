import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x5142f7e9d4b416c0c6531ef23e5637fb56a34e731b73c0f10a26a25a72ef2077";

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
