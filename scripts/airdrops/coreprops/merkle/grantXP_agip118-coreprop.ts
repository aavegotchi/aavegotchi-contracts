import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0xba11262fc75ec6b49dafcdfb55c6aa3395ce58c18aa377b6a955d695a27ff3f0";

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
