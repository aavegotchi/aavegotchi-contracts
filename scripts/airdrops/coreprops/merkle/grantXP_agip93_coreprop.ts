import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xd3c0ca68dedf236a9418b51fb9743dc4428182d7b178528f80a448dd5b2aeb6e";

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
