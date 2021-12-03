import { run } from "hardhat";

async function batchDeposit() {
  const badgeId = "264";
  const gotchiIds = [1549, 8062, 4479, 9106, 1306];

  ///End Test
  await run("batchDeposit", {
    gotchiIds: gotchiIds.join(","),
    quantity: "1",
    itemId: badgeId,
  });
}

batchDeposit()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.batchDeposit = batchDeposit;
