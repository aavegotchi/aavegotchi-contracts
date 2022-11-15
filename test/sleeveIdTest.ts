import { ethers, network } from "hardhat";
import { expect } from "chai";
import { SvgFacet } from "../typechain";
import {
  maticDiamondAddress,
  itemManager,
  impersonate,
} from "../scripts/helperFunctions";
import { BigNumberish } from "@ethersproject/bignumber";

describe("Testing getNextSleeveId", async function () {
  this.timeout(200000000);
  let svgFacet: SvgFacet;

  before(async function () {
    svgFacet = (await ethers.getContractAt(
      "SvgFacet",
      maticDiamondAddress
    )) as SvgFacet;

    // await upgrade;
  });

  it.only("Should return next available id index for new sleeves set", async function () {
    let nextId: BigNumberish = await svgFacet.getNextSleeveId();
    console.log("Next Id: ", nextId.toString());

    let newStartId: number = parseInt(nextId.toString());

    expect(newStartId).to.equal(49);

    svgFacet = await impersonate(itemManager, svgFacet, ethers, network);
  });

  it.only("Should NOT set a new next available sleeve id", async function () {
    svgFacet = await impersonate(itemManager, svgFacet, ethers, network);

    const sleeves = [
      {
        sleeveId: 28,
        wearableId: 46,
      },
    ];

    await svgFacet.setSleeves(sleeves);

    const nextId: BigNumberish = await svgFacet.getNextSleeveId();
    const newStartId: number = parseInt(nextId.toString());

    expect(newStartId).to.equal(49);
  });
});
