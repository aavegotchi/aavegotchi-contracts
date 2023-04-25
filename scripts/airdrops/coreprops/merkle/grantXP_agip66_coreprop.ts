import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x93f3e0fc14dec5ca662b6ec0df89a8ec3e22502e0171c326d087defd93c5ac2f";

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
