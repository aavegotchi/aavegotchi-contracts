import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xb1c3b5c9954e3e7a00498296396b4b516bae69ba6a62b4e1c9c3d209d1eaf672";

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
