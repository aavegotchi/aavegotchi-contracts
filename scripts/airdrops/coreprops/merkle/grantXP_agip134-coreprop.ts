import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x4a6d74f3bc0cc93e10098ee9a882ebcf8124ab0efc0f6abd278eb716f7cceeb4";

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
