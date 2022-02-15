import { ethers, run } from "hardhat";

import { Exceptions } from "../../scripts/itemTypeHelpers";
import { convertExceptionsToTaskFormat } from "../../tasks/updateWearableExceptions";

async function main() {
  const front = ethers.utils.formatBytes32String("wearables-front");
  const back = ethers.utils.formatBytes32String("wearables-back");
  const left = ethers.utils.formatBytes32String("wearables-left");
  const right = ethers.utils.formatBytes32String("wearables-right");

  const payload: Exceptions[] = [
    /* {
      itemId: 237,
      slotPosition: 6,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 238,
      slotPosition: 6,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 261,
      slotPosition: 6,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 305,
      slotPosition: 6,
      side: back,
      exceptionBool: true,
    }, */
  ];

  // await run("updateWearableExcpetions", convertExceptionsToTaskFormat(payload));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
