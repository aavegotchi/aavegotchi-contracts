import { ethers, run } from "hardhat";

import { Exceptions } from "../../scripts/itemTypeHelpers";
import { convertExceptionsToTaskFormat } from "../../tasks/updateWearableExceptions";

async function main() {
  const payload: Exceptions[] = [
    /* //right hand
    {
      itemId: 23,
      slotPosition: 4,
      side: "wearables-left",
      exceptionBool: true,
    },
    {
      itemId: 23,
      slotPosition: 4,
      side: "wearables-right",
      exceptionBool: true,
    },
    {
      itemId: 201,
      slotPosition: 4,
      side: "wearables-back",
      exceptionBool: true,
    },
    {
      itemId: 201,
      slotPosition: 4,
      side: "wearables-left",
      exceptionBool: true,
    },
    {
      itemId: 201,
      slotPosition: 4,
      side: "wearables-right",
      exceptionBool: true,
    },
    {
      itemId: 217,
      slotPosition: 4,
      side: "wearables-back",
      exceptionBool: true,
    },
    {
      itemId: 217,
      slotPosition: 4,
      side: "wearables-left",
      exceptionBool: true,
    },
    {
      itemId: 217,
      slotPosition: 4,
      side: "wearables-right",
      exceptionBool: true,
    },
    {
      itemId: 223,
      slotPosition: 4,
      side: "wearables-back",
      exceptionBool: true,
    },
    {
      itemId: 223,
      slotPosition: 4,
      side: "wearables-left",
      exceptionBool: true,
    },
    {
      itemId: 223,
      slotPosition: 4,
      side: "wearables-right",
      exceptionBool: true,
    },
    {
      itemId: 312,
      slotPosition: 4,
      side: "wearables-left",
      exceptionBool: true,
    },
    {
      itemId: 312,
      slotPosition: 4,
      side: "wearables-right",
      exceptionBool: true,
    },
    //left hand
    {
      itemId: 23,
      slotPosition: 5,
      side: "wearables-left",
      exceptionBool: true,
    },
    {
      itemId: 23,
      slotPosition: 5,
      side: "wearables-right",
      exceptionBool: true,
    },
    {
      itemId: 201,
      slotPosition: 5,
      side: "wearables-back",
      exceptionBool: true,
    },
    {
      itemId: 201,
      slotPosition: 5,
      side: "wearables-left",
      exceptionBool: true,
    },
    {
      itemId: 201,
      slotPosition: 5,
      side: "wearables-right",
      exceptionBool: true,
    },
    {
      itemId: 217,
      slotPosition: 5,
      side: "wearables-back",
      exceptionBool: true,
    },
    {
      itemId: 217,
      slotPosition: 5,
      side: "wearables-left",
      exceptionBool: true,
    },
    {
      itemId: 217,
      slotPosition: 5,
      side: "wearables-right",
      exceptionBool: true,
    },
    {
      itemId: 223,
      slotPosition: 5,
      side: "wearables-back",
      exceptionBool: true,
    },
    {
      itemId: 223,
      slotPosition: 5,
      side: "wearables-left",
      exceptionBool: true,
    },
    {
      itemId: 223,
      slotPosition: 5,
      side: "wearables-right",
      exceptionBool: true,
    },
    {
      itemId: 312,
      slotPosition: 5,
      side: "wearables-left",
      exceptionBool: true,
    },
    {
      itemId: 312,
      slotPosition: 5,
      side: "wearables-right",
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
