const { expect } = require("chai");
const { ethers } = require("hardhat");
const truffleAsserts = require("truffle-assertions");
const {
  tokenIdsWithKinship,
} = require("../scripts/upgrades/upgrade-tokenIdsWithKinship.js");

describe("testing tokenIdsWitKinship", async function () {
  this.timeout(300000);

  let aavegotchiDiamondAddress, user, gameFacet;

  before(async () => {
    aavegotchiDiamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
    user = "0x3a79bF3555F33f2adCac02da1c4a0A0163F666ce";
    await tokenIdsWithKinship();
    gameFacet = await ethers.getContractAt(
      "AavegotchiGameFacet",
      aavegotchiDiamondAddress
    );
  });

  it("Should only return the first two gotchis", async () => {
    const gotchis = await gameFacet.tokenIdsWithKinship(user, 2, 0, false);
    expect(gotchis.length).to.equal(2);

    console.log("gotchis:", gotchis);
  });

  it("Should return all four user gotchis", async () => {
    const gotchis = await gameFacet.tokenIdsWithKinship(
      user,
      0, //input here does not matter
      0, //inut here does not matter
      true
    );

    console.log("gotchis:", gotchis);

    expect(gotchis.length).to.equal(4);
  });

  it("should fail while trying to return more than the user has", async () => {
    await truffleAsserts.reverts(
      gameFacet.tokenIdsWithKinship(user, 10, 0, false),
      "gameFacet: Owner does not have up to that amount of tokens"
    );
  });
});
