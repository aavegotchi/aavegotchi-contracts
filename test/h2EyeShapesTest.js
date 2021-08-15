/* global describe it before ethers */
const { expect } = require("chai");
const {
  upgradeH2EyeShapes,
} = require("../scripts/upgrades/upgrade-h2EyeShapes.js");
const { eyeShapeSvgs } = require("../svgs/eyeShapesH2.js");
const { getH2Collaterals } = require("../scripts/collateralTypesHaunt2.js");

const testAavegotchiId = "10000";
const testEyeShapeId = "1";
const initialHauntSize = "10000";
let portalPrice = ethers.utils.parseEther("0.00001");
const account = "0x45fdb9d9ff3105392bf5f1a3828f9523314117a7";
const ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";

describe("Upgrade H2 eye shapes", async function () {
  this.timeout(300000);
  let diamondAddress, signer;
  let daoFacet,
    aavegotchiFacet,
    aavegotchiGameFacet,
    svgFacet,
    vrfFacet,
    shopFacet,
    ghstTokenContract;
  let haunt, currentHauntId, buyAmount;
  before(async function () {
    const deployVars = await upgradeH2EyeShapes("deployTest");
    diamondAddress = deployVars.diamondAddress;
    signer = await deployVars.signer;
    // Transfer ownership for GHST balance
    await (
      await (
        await ethers.getContractAt("OwnershipFacet", diamondAddress)
      ).connect(signer)
    ).transferOwnership(account);
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [account],
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
    ).connect(signer);
    ghstTokenContract = await (
      await ethers.getContractAt("GHSTFacet", ghstAddress)
    ).connect(signer);

    // await (await daoFacet.addItemManagers([account])).wait();
  });

  describe("Create new haunt", function () {
    it("Should get current haunt info", async function () {
      haunt = await aavegotchiGameFacet.currentHaunt();
      currentHauntId = haunt["hauntId_"].toNumber();
      expect(currentHauntId).to.equal(1);
    });

    it("Should create new haunt", async function () {
      await (
        await daoFacet.createHaunt(initialHauntSize, portalPrice, "0x000000")
      ).wait();
      haunt = await aavegotchiGameFacet.currentHaunt();
      currentHauntId = haunt["hauntId_"].toNumber();
      expect(currentHauntId).to.equal(2);

      let itemManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [itemManager],
      });
      signer = await ethers.provider.getSigner(itemManager);
      const imDaoContract = await ethers.getContractAt(
        "DAOFacet",
        diamondAddress,
        signer
      );

      await (
        await imDaoContract.addCollateralTypes(
          currentHauntId,
          getH2Collaterals("hardhat", ghstTokenContract.address)
        )
      ).wait();

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [account],
      });
      signer = await ethers.provider.getSigner(account);
    });
  });

  describe("Buy and open Portals and claim new aavegotchi", function () {
    it("Should purchase portal", async function () {
      const balance = await ghstTokenContract.balanceOf(account);
      await ghstTokenContract.approve(diamondAddress, balance);
      buyAmount = portalPrice.mul(5);
      await (await shopFacet.buyPortals(account, buyAmount)).wait();

      const myPortals = await aavegotchiFacet.allAavegotchisOfOwner(account);
      expect(myPortals.length).to.equal(5);
    });

    it("Should open the portal", async function () {
      let myPortals = await aavegotchiFacet.allAavegotchisOfOwner(account);
      expect(myPortals[0].status).to.equal(0);
      await vrfFacet.openPortals(["10000", "10001", "10002", "10003"]);

      myPortals = await aavegotchiFacet.allAavegotchisOfOwner(account);
      expect(myPortals[0].status).to.equal(2);
    });

    it("Should contain 10 random ghosts in the portal", async function () {
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

    it("Can only set name on claimed Aavegotchi", async function () {
      await expect(
        aavegotchiGameFacet.setAavegotchiName("10001", "Portal")
      ).to.be.revertedWith(
        "AavegotchiGameFacet: Must claim Aavegotchi before setting name"
      );
    });

    it("Should claim an Aavegotchi", async function () {
      const myPortals = await aavegotchiFacet.allAavegotchisOfOwner(account);
      const tokenId = myPortals[0].tokenId;
      const ghosts = await aavegotchiGameFacet.portalAavegotchiTraits(tokenId);
      const selectedGhost = ghosts[4];

      const minStake = selectedGhost.minimumStake;
      console.log(minStake.toString());
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

  describe("H2 eye shape", async function () {
    it("Returns h2 eye shape SVG", async function () {
      const svg = await svgFacet.getSvg(
        ethers.utils.formatBytes32String("eyeShapesH2"),
        testEyeShapeId
      );
      console.log("eye svg:", svg);
      expect(svg).to.equal(eyeShapeSvgs[testEyeShapeId]);
    });

    it("Returned aavegotchi SVG including correct eye shape", async function () {
      const myPortals = await aavegotchiFacet.allAavegotchisOfOwner(account);

      console.log("my portals:", myPortals[0]);
      const tokenId = myPortals[0].tokenId;

      const eyeShapeRange = [
        0, 1, 2, 5, 7, 10, 15, 20, 25, 42, 58, 75, 80, 85, 90, 93, 95, 98,
      ];

      const eyeShapeTrait = myPortals[0].numericTraits[4]; //[ 23, 18, 34, 42, 8, 38 ],

      var index = eyeShapeRange.findIndex((number) => {
        return number > eyeShapeTrait;
      });

      console.log("final eye shape:", index);

      const svg = await svgFacet.getAavegotchiSvg(tokenId);
      console.log(svg);

      expect(svg.includes(eyeShapeSvgs[index - 1])).to.equal(true);
    });
  });
});
