/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
import { upgrade } from "../../scripts/upgrades/upgrade-access-rights";
import { impersonate } from "../../scripts/helperFunctions";
import { AccessRightsFacet } from "../../typechain";
import { BigNumberish } from "ethers";

const { expect } = chai;

describe("Testing Access Rights", async function () {
  this.timeout(300000);
  let accessFacet: AccessRightsFacet;

  before(async function () {
    await upgrade();
    accessFacet = (await ethers.getContractAt(
      "AccessRightsFacet",
      "0x86935F11C86623deC8a25696E1C19a8659CbF95d"
    )) as AccessRightsFacet;
    accessFacet = (await impersonate(
      "0x8FEebfA4aC7AF314d90a0c17C3F91C800cFdE44B",
      accessFacet,
      ethers,
      network
    )) as AccessRightsFacet;
  });

  it("Should add access rights", async function () {
    for (let i = 0; i < 1; i++) {
      for (let j = 0; j < 2; j++) {
        await accessFacet.setAccessRight(21655, i, j);
        expect(await accessFacet.getAccessRight(21655, i)).to.be.equal(j);
      }
    }
  });
  it("Should not add invalid access rights", async function () {
    expect(await accessFacet.setAccessRight(21655, 0, 2)).to.be.revertedWith(
      "AccessRightsFacet: Invalid access right"
    );
    expect(await accessFacet.setAccessRight(21655, 1, 0)).to.be.revertedWith(
      "AccessRightsFacet: Invalid access right"
    );
  });
  it("Only owner should be able to change access rights", async function () {
    expect(await accessFacet.setAccessRight(100, 1, 0)).to.be.revertedWith(
      "LibAppStorage: Only aavegotchi owner can call this function"
    );
  });
  it("Only unlocked tokens should be able to change access rights", async function () {
    expect(await accessFacet.setAccessRight(22003, 1, 0)).to.be.revertedWith(
      "LibAppStorage: Only callable on unlocked Aavegotchis"
    );
  });
});
