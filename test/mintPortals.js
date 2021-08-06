const { expect } = require("chai");
const { ethers } = require("hardhat");
const truffleAsserts = require("truffle-assertions");
//const j = require("../scripts/upgrades/upgrade-mintPortal.js");
//const k = require("../scripts/createhaunt2.js");
describe("Testing mintPortal()", async function () {
  this.timeout(300000);

  let aavegotchiDiamondAddress, gotchifacet, owner, testAdd, shopFacet, txData;

  before(async () => {
    //await j.mintPortal();
    // await k.createH2();
    aavegotchiDiamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
    owner = await (
      await ethers.getContractAt("OwnershipFacet", aavegotchiDiamondAddress)
    ).owner();
    signer = await ethers.provider.getSigner(owner);
    // aavegotchiGameFacet = await ethers.getContractAt('AavegotchiGameFacet', aavegotchiDiamondAddress);

    testAdd = "0x19B0c0CA183A730966e314eA55e08e5Ece10f928";
    shopFacet = (
      await ethers.getContractAt("ShopFacet", aavegotchiDiamondAddress)
    ).connect(signer);

    gotchifacet = await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      aavegotchiDiamondAddress
    );
  });

  it("mints 1 portal to an address", async () => {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });

    const tx = await shopFacet.mintPortals(testAdd, 1);
    const newGotchi = await gotchifacet.getAavegotchi(10000);
    const gotchiOwner = await gotchifacet.ownerOf(10000);
    // console.log(newGotchi);
    txData = await tx.wait();
    const events = txData.events;
    console.log(events);
    expect(gotchiOwner).to.equal(testAdd);
    expect(newGotchi.hauntId.toString()).to.equal("2");
    //console.log(await tx.wait());
  });

  it("only the owner should be able to mint Portals", async () => {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [testAdd],
    });
    signer = await ethers.provider.getSigner(testAdd);
    shopFacet = (
      await ethers.getContractAt("ShopFacet", aavegotchiDiamondAddress)
    ).connect(signer);

    await truffleAsserts.reverts(
      shopFacet.mintPortals(testAdd, 1),
      "LibDiamond: Must be contract owner"
    );
  });
});
