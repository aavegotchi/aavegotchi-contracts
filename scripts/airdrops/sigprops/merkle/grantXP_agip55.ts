import { run } from "hardhat";

async function addXPDrop() {
  const propId =
    "0x1f84e1141646282c7e09271cd267c15537298b8086f03c97d2cdefb1f7a181e5";

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

exports.grantXP = addXPDrop;
