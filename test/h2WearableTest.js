/* global describe it before ethers */
const { expect } = require("chai");
const {
  addH2Wearables
} = require("../scripts/addH2Wearables");
const { getCollaterals } = require("../scripts/collateralTypesHaunt2.js");
const {
  upgradeH2EyeShapes,
} = require("../scripts/upgrades/upgrade-h2EyeShapes.js");
const { uploadH2EyeShapeSVG } = require("../scripts/upgrades/uploadH2EyeShapeSVG.js");
const {
  upgradeVrfFacet4Test
} = require("../scripts/upgrades/upgrade-vrfFacet4Test.js");

const initialHauntSize = "10000";
let portalPrice = ethers.utils.parseEther("0.00001");
const account = "0x45fdb9d9ff3105392bf5f1a3828f9523314117a7";
const ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";

describe("Upgrade H2 wearables", async function() {
  this.timeout(10000000);

  let diamondAddress, signer, itemManager;
  let daoFacet,
    aavegotchiFacet,
    aavegotchiGameFacet,
    svgFacet,
    vrfFacet,
    shopFacet,
    itemsFacet,
    itemsTransferFacet,
    ghstTokenContract;
  let haunt, currentHauntId;

  before(async function() {
    console.log("Upgrading VRFFacet for test");
    await upgradeVrfFacet4Test();
    await upgradeH2EyeShapes("deployTest");
    await uploadH2EyeShapeSVG();

    const deployVars = await addH2Wearables("deployTest");

    diamondAddress = deployVars.diamondAddress;
    itemManager = await deployVars.signer;

    const owner = await (
      await ethers.getContractAt("OwnershipFacet", diamondAddress)
    ).owner();
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner]
    });
    signer = await ethers.provider.getSigner(owner);

    // Transfer ownership for GHST balance
    await (
      await (
        await ethers.getContractAt("OwnershipFacet", diamondAddress)
      ).connect(signer)
    ).transferOwnership(account);
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [account]
    });
    signer = await ethers.provider.getSigner(account);
    daoFacet = await (
      await ethers.getContractAt("DAOFacet", diamondAddress)
    ).connect(signer);
    aavegotchiFacet = await (
      await ethers.getContractAt(
        "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
        diamondAddress
      )
    ).connect(signer);
    aavegotchiGameFacet = await (
      await ethers.getContractAt("AavegotchiGameFacet", diamondAddress)
    ).connect(signer);
    svgFacet = await (
      await ethers.getContractAt("SvgFacet", diamondAddress)
    ).connect(signer);
    vrfFacet = await (
      await ethers.getContractAt("VrfFacet", diamondAddress)
    ).connect(signer);
    shopFacet = await (
      await ethers.getContractAt("ShopFacet", diamondAddress)
    ).connect(itemManager);
    itemsFacet = await (
      await ethers.getContractAt("contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet", diamondAddress)
    ).connect(signer);
    itemsTransferFacet = await (
      await ethers.getContractAt("ItemsTransferFacet", diamondAddress)
    ).connect(itemManager);
    ghstTokenContract = await (
      await ethers.getContractAt("GHSTFacet", ghstAddress)
    ).connect(signer);
  });

  describe("Create new haunt", function() {
    it("Should get current haunt info", async function() {
      haunt = await aavegotchiGameFacet.currentHaunt();
      currentHauntId = haunt["hauntId_"].toNumber();
      expect(currentHauntId).to.equal(1);
    });

    it("Should create new haunt", async function() {
      await (
        await daoFacet.createHaunt(initialHauntSize, portalPrice, "0x000000")
      ).wait();
      haunt = await aavegotchiGameFacet.currentHaunt();
      currentHauntId = haunt["hauntId_"].toNumber();
      expect(currentHauntId).to.equal(2);

      const imDaoContract = await ethers.getContractAt(
        "DAOFacet",
        diamondAddress,
        itemManager
      );

      await (
        await imDaoContract.addCollateralTypes(
          currentHauntId,
          getCollaterals("hardhat", ghstTokenContract.address)
        )
      ).wait();
    });
  });

  describe("Mint and open Portals and claim new aavegotchi", function() {
    it("Should mint portal", async function() {
      const balance = await ghstTokenContract.balanceOf(account);
      await ghstTokenContract.approve(diamondAddress, balance);
      await (await shopFacet.mintPortals(account, 5)).wait();

      const myPortals = await aavegotchiFacet.allAavegotchisOfOwner(account);
      expect(myPortals.length).to.equal(5);
    });

    it("Should open the portal", async function() {
      let myPortals = await aavegotchiFacet.allAavegotchisOfOwner(account);
      expect(myPortals[0].status).to.equal(0);
      await vrfFacet.openPortals(["10000", "10001", "10002", "10003"]);

      myPortals = await aavegotchiFacet.allAavegotchisOfOwner(account);
      expect(myPortals[0].status).to.equal(2);
    });

    it("Should contain 10 random ghosts in the portal", async function() {
      const myPortals = await aavegotchiFacet.allAavegotchisOfOwner(account);
      const ghosts = await aavegotchiGameFacet.portalAavegotchiTraits(
        myPortals[0].tokenId
      );
      // console.log(JSON.stringify(ghosts, null, 4))
      ghosts.forEach(async (ghost) => {
        const rarityScore = await aavegotchiGameFacet.baseRarityScore(
          ghost.numericTraits
        );
        expect(Number(rarityScore)).to.greaterThan(298);
        expect(Number(rarityScore)).to.lessThan(602);
      });
      expect(ghosts.length).to.equal(10);
    });

    it("Can only set name on claimed Aavegotchi", async function() {
      await expect(
        aavegotchiGameFacet.setAavegotchiName("10001", "Portal")
      ).to.be.revertedWith(
        "AavegotchiGameFacet: Must claim Aavegotchi before setting name"
      );
    });

    it("Should claim an Aavegotchi", async function() {
      const myPortals = await aavegotchiFacet.allAavegotchisOfOwner(account);
      const tokenId = myPortals[0].tokenId;
      const ghosts = await aavegotchiGameFacet.portalAavegotchiTraits(tokenId);
      const selectedGhost = ghosts[4];

      const minStake = selectedGhost.minimumStake;
      // console.log(minStake.toString());
      await aavegotchiGameFacet.claimAavegotchi(tokenId, 4, minStake);
      const kinship = await aavegotchiGameFacet.kinship(tokenId);

      const aavegotchi = await aavegotchiFacet.getAavegotchi(tokenId);

      const collateral = aavegotchi.collateral;
      expect(selectedGhost.collateralType).to.equal(collateral);
      expect(aavegotchi.status).to.equal(3);
      expect(aavegotchi.hauntId).to.equal(2);
      expect(aavegotchi.stakedAmount).to.equal(minStake);
      expect(kinship).to.equal(50);
    });
  });

  describe("Wearables", async function() {
    it("Equip wearables and check", async function() {
      const myPortals = await aavegotchiFacet.allAavegotchisOfOwner(account);
      const tokenId = myPortals[0].tokenId;
      const itemManagerAddress = await itemManager.getAddress();

      await itemsTransferFacet.safeTransferFrom(itemManagerAddress, account, 214, 1, []);
      await itemsTransferFacet.safeTransferFrom(itemManagerAddress, account, 222, 1, []);
      await itemsTransferFacet.safeTransferFrom(itemManagerAddress, account, 226, 1, []);
      await itemsTransferFacet.safeTransferFrom(itemManagerAddress, account, 244, 1, []);

      await itemsFacet.equipWearables(tokenId, [0, 0, 214, 226, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      let svgOutput = await svgFacet.getAavegotchiSvg(tokenId);
      console.log("wearable 214, 226 - svg output:", svgOutput);

      await itemsFacet.equipWearables(tokenId, [222, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      svgOutput = await svgFacet.getAavegotchiSvg(tokenId);
      console.log("wearable 222 - svg output:", svgOutput);

      await itemsFacet.equipWearables(tokenId, [244, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      svgOutput = await svgFacet.getAavegotchiSvg(tokenId);
      console.log("wearable 244 - svg output:", svgOutput);
    });
  });
});
