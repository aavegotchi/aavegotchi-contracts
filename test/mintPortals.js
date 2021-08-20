const { expect } = require("chai");
const { ethers } = require("hardhat");
const truffleAsserts = require("truffle-assertions");

describe("Testing mintPortal()", async function () {
  this.timeout(300000);

  let aavegotchiDiamondAddress,
    gotchifacet,
    owner,
    testAdd,
    shopFacet,
    txData,
    daoFacet,
    ownershipFacet,
    totalGasUsed;
  const noOfPortals = 1;

  before(async () => {
    aavegotchiDiamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";

    ownershipFacet = await ethers.getContractAt(
      "OwnershipFacet",
      aavegotchiDiamondAddress
    );
    owner = await ownershipFacet.owner();

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });

    console.log("owner:", owner);
    signer = await ethers.provider.getSigner(owner);

    //console.log("signer:", signer);

    testAdd = "0x19B0c0CA183A730966e314eA55e08e5Ece10f928";
    shopFacet = await ethers.getContractAt(
      "ShopFacet",
      aavegotchiDiamondAddress,
      signer
    );

    daoFacet = await ethers.getContractAt(
      "DAOFacet",
      aavegotchiDiamondAddress,
      signer
    );
  });

  it("mints 1 portal to an address", async () => {
    console.log("Deploying portal upgrade");

    const {
      mintPortal: mintPortalUpgrade,
    } = require("../scripts/upgrades/upgrade-mintPortal.js");
    await mintPortalUpgrade();

    const { createH2: createHaunt2 } = require("../scripts/createhaunt2.js");
    console.log("Creating Haunt 2");
    await createHaunt2();

    console.log("owner:", owner);
    await daoFacet.addItemManagers([owner]);
    gotchifacet = await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      aavegotchiDiamondAddress
    );

    console.log("");

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
    console.log(newGotchi);

    expect(gotchiOwner).to.equal(testAdd);
    expect(newGotchi.hauntId.toString()).to.equal("2");
    //console.log(await tx.wait());
  });

  it("only an ItemManager can mint Portals", async () => {
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
      "LibAppStorage: only an ItemManager can call this function"
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
