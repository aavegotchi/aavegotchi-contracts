//exceptions for : pet - rofls(151, 152, 153, 154, 155, 156), antenna bot(261)
//                 hand - mechanical glove(201), energy gun(217), hook hand(223)

import { ethers, network } from "hardhat";
import { SvgViewsFacet } from "../../typechain";
import { upgrade } from "../../scripts/upgrades/upgrade-sideViewsExceptions";
import {
  maticDiamondAddress,
  itemManager,
} from "../../scripts/helperFunctions";
import { Exceptions } from "../../scripts/itemTypeHelpers";
import { Signer } from "@ethersproject/abstract-signer";

export async function main() {
  const diamondAddress = maticDiamondAddress;
  let svgViewsFacet: SvgViewsFacet;
  let signer: Signer;

  const testing = ["hardhat", "localhost"].includes(network.name);

  if (testing) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManager],
    });
    signer = await ethers.getSigner(itemManager);
  } else if (network.name === "matic") {
    const accounts = await ethers.getSigners();
    signer = accounts[0]; //new LedgerSigner(ethers.provider);

    console.log("signer:", signer);
  } else {
    throw Error("Incorrect network selected");
  }

  svgViewsFacet = (await ethers.getContractAt(
    "SvgViewsFacet",
    diamondAddress,
    signer
  )) as SvgViewsFacet;

  //exceptions
  const rightExceptions: Exceptions[] = [
    {
      itemId: 201,
      slotPosition: 4,
      exceptionBool: true,
    },
    {
      itemId: 217,
      slotPosition: 4,
      exceptionBool: true,
    },
    {
      itemId: 223,
      slotPosition: 4,
      exceptionBool: true,
    },
  ];
  const leftExceptions: Exceptions[] = [
    {
      itemId: 201,
      slotPosition: 5,
      exceptionBool: true,
    },
    {
      itemId: 217,
      slotPosition: 5,
      exceptionBool: true,
    },
    {
      itemId: 223,
      slotPosition: 5,
      exceptionBool: true,
    },
  ];
  const petExceptions: Exceptions[] = [
    {
      itemId: 261,
      slotPosition: 6,
      exceptionBool: true,
    },
    {
      itemId: 151,
      slotPosition: 6,
      exceptionBool: true,
    },
    {
      itemId: 152,
      slotPosition: 6,
      exceptionBool: true,
    },
    {
      itemId: 153,
      slotPosition: 6,
      exceptionBool: true,
    },
    {
      itemId: 154,
      slotPosition: 6,
      exceptionBool: true,
    },
    {
      itemId: 155,
      slotPosition: 6,
      exceptionBool: true,
    },
    {
      itemId: 156,
      slotPosition: 6,
      exceptionBool: true,
    },
  ];

  console.log("Creating Exceptions");
  await svgViewsFacet.setSideViewExceptions(rightExceptions);
  await svgViewsFacet.setSideViewExceptions(leftExceptions);
  await svgViewsFacet.setSideViewExceptions(petExceptions);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
