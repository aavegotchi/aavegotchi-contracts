import { ethers } from "hardhat";
import { expect } from "chai";
import { SvgViewsFacet } from "../typechain";
import { upgrade } from "../scripts/upgrades/upgrade-sideViewsExceptions";
import { maticDiamondAddress } from "../scripts/helperFunctions";

describe("Testing Exceptions", async function () {
  const diamondAddress = maticDiamondAddress;
  let svgViewsFacet: SvgViewsFacet;

  const rightExceptions: any[] = [];
  const leftExceptions: any[] = [];
  const backExceptions: any[] = [];

  before(async function () {
    svgViewsFacet = (await ethers.getContractAt(
      "SvgViewsFacet",
      diamondAddress
    )) as SvgViewsFacet;

    await upgrade();
  });

  it.only("Should create left and right hand exceptions", async function () {
    //hand exceptions
    rightExceptions.push(
      {
        itemId: 201,
        slotPosition: 4,
        exceptionBool: true,
      },
      {
        itemId: 217,
        slotPosition: 4,
        exceptionBool: true,
      }
    );
    leftExceptions.push(
      {
        itemId: 201,
        slotPosition: 5,
        exceptionBool: true,
      },
      {
        itemId: 217,
        slotPosition: 5,
        exceptionBool: true,
      }
    );

    console.log("Testing");
  });
});
