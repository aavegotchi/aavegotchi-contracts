import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x9b3d0d73ff761611be704a786b207a4f74c697febfdb1e95414d83c55989a05f";

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
