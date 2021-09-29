/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import { upgrade } from "../scripts/upgrades/upgrade-removeExperience";
import { impersonate } from "../scripts/helperFunctions";
import { AavegotchiFacet, DAOFacet, ItemsFacet } from "../typechain";
import { expect } from "chai";

describe("Testing Slot Change", async function () {
  this.timeout(300000);
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let daoFacet: DAOFacet;

  let itemManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
  let itemsFacet: ItemsFacet;

  // this.timeout(300000)
  before(async function () {
    await upgrade();

    daoFacet = (await ethers.getContractAt(
      "DAOFacet",
      diamondAddress
    )) as DAOFacet;

    itemsFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      diamondAddress
    )) as ItemsFacet;
  });

  it("Test Remove XP", async function () {
    daoFacet = await impersonate(itemManager, daoFacet, ethers, network);

    const aavegotchiFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      diamondAddress
    )) as AavegotchiFacet;

    let aavegotchi = await aavegotchiFacet.getAavegotchi("22449");
    expect(aavegotchi.experience).to.equal("40");

    console.log("xp:", aavegotchi.experience.toString());

    const tx = await daoFacet.removeExperience(["22449"], ["40"]);

    const receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Transfer failed: ${tx.hash}`);
    }

    aavegotchi = await aavegotchiFacet.getAavegotchi("22449");
    expect(aavegotchi.experience).to.equal("0");

    console.log("xp:", aavegotchi.experience.toString());
  });

  it("Reverts for Gotchi with 0 XP", async function () {
    daoFacet = await impersonate(itemManager, daoFacet, ethers, network);

    await expect(
      daoFacet.removeExperience(["18937"], ["40"])
    ).to.be.revertedWith("DAOFacet: Remove XP would underflow");
  });
});
