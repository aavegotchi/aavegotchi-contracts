const { expect } = require("chai");
const { ethers } = require("hardhat");
const truffleAsserts = require("truffle-assertions");
//const j = require("../scripts/upgrades/upgrade-mintPortal.js");
//const k = require("../scripts/createhaunt2.js");

describe("Testing mintPortal()", async function () {
  this.timeout(300000);

  let aavegotchiDiamondAddress,
    gotchifacet,
    owner,
    testAdd,
    shopFacet,
    txData,
    totalGasUsed;
  const noOfPortals = 50;
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

  it("mints 50 portals to an address", async () => {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });

    const tx = await shopFacet.mintPortals(testAdd, noOfPortals);
    txData = await tx.wait();
    //console.log(txData);
    totalGasUsed = txData.gasUsed;
    console.log(
      "gas used in minting",
      noOfPortals,
      "portal(s) is: ",
      totalGasUsed.toString()
    );
    const newGotchi = await gotchifacet.getAavegotchi(10000);
    const gotchiOwner = await gotchifacet.ownerOf(10000);
    // console.log(newGotchi);

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

  it("should not allow the xingyun function to be called", async () => {
    const Xing = await ethers.getContractAt(
      "XingyunFacet",
      aavegotchiDiamondAddress
    );
    //await Xing.xingyun("0xE47d2d47aA7fd150Fe86045e81509B09454a4Ee5", 30000000);
    await truffleAsserts.reverts(
      Xing.xingyun("0xE47d2d47aA7fd150Fe86045e81509B09454a4Ee5", 30000000),
      "Diamond: Function does not exist"
    );
  });

  /*
  it("should not allow the buyPortals function to be called", async () => {
    const Xing = await ethers.getContractAt(
      "XingyunFacet",
      aavegotchiDiamondAddress
    );
    //await Xing.xingyun("0xE47d2d47aA7fd150Fe86045e81509B09454a4Ee5", 30000000);
    await truffleAsserts.reverts(
      shopFacet.buyPortals(
        "0xE47d2d47aA7fd150Fe86045e81509B09454a4Ee5",
        30000000
      ),
      "Diamond: Function does not exist"
    );
  });*/
});
