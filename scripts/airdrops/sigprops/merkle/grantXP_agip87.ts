import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x42bbb17dd055adac28433a16b145ff45e732080402cf44e7d7dfec051555f16f";

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
