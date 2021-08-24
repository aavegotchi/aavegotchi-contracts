/* global describe it before ethers */
const { expect } = require("chai");
const { addH2Wearables } = require("../scripts/addH2Wearables");
const { getCollaterals } = require("../scripts/collateralTypesHaunt2.js");
const {
  uploadH2EyeShapeSVG,
} = require("../scripts/upgrades/uploadH2EyeShapeSVG.js");
const {
  upgradeVrfFacet4Test,
} = require("../scripts/upgrades/upgrade-vrfFacet4Test.js");

const initialHauntSize = "10000";
let portalPrice = ethers.utils.parseEther("0.00001");
const account = "0x45fdb9d9ff3105392bf5f1a3828f9523314117a7";
const ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";

describe("Upgrade H2 wearables", async function () {
  this.timeout(10000000);

  let diamondAddress, signer, itemManager;
  let daoFacet,
    aavegotchiFacet,
    aavegotchiGameFacet,
    svgFacet,
    vrfFacet,
    shopFacet,
    ghstTokenContract;

  before(async function () {
    const deployVars = await addH2Wearables("deployTest");

    diamondAddress = deployVars.diamondAddress;
    itemManager = await deployVars.signer;

    const owner = await (
      await ethers.getContractAt("OwnershipFacet", diamondAddress)
    ).owner();
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
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
    ).connect(itemManager);
    itemsFacet = await (
      await ethers.getContractAt(
        "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
        diamondAddress
      )
    ).connect(signer);
    itemsTransferFacet = await (
      await ethers.getContractAt("ItemsTransferFacet", diamondAddress)
    ).connect(itemManager);
    ghstTokenContract = await (
      await ethers.getContractAt("GHSTFacet", ghstAddress)
    ).connect(signer);
  });

  describe("Wearables", async function () {
    it("Equip wearables and check", async function () {
      for (const wearableSvgId of [213, 220, 222, 231, 234, 241, 244]) {
        let preview = await svgFacet.previewAavegotchi(
          "2",
          ghstTokenContract.address,
          [0, 0, 0, 0, 0, 0],
          [wearableSvgId, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        );
        console.log(`Body wearable ${wearableSvgId} preview`, preview);
      }
    });
  });
});
