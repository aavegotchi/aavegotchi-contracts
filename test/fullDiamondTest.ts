/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers } from "hardhat";
import {
  AavegotchiFacet,
  AavegotchiGameFacet,
  DAOFacet,
  DiamondLoupeFacet,
  ItemsFacet,
  ShopFacet,
  SvgFacet,
  SvgViewsFacet,
  VrfFacet,
} from "../typechain";

import { deployFullDiamond } from "../scripts/deployFullDiamond";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, BigNumberish } from "ethers";

describe("Full Diamond Test", async function () {
  let aavegotchiFacet: AavegotchiFacet;
  let shopFacet: ShopFacet;
  let daoFacet: DAOFacet;
  let svgFacet: SvgFacet;
  let svgViewsFacet: SvgViewsFacet;
  let itemsFacet: ItemsFacet;
  let aavegotchiGameFacet: AavegotchiGameFacet;
  let diamondLoupeFacet: DiamondLoupeFacet;
  let vrfFacet: VrfFacet;
  let aavegotchiDiamondAddress: string;
  let forgeDiamondAddress: string;
  let wearableDiamondAddress: string;
  let ghstContractAddress: string;

  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  async function setupFacets() {
    daoFacet = (await ethers.getContractAt(
      "DAOFacet",
      aavegotchiDiamondAddress
    )) as DAOFacet;

    itemsFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      aavegotchiDiamondAddress
    )) as ItemsFacet;

    diamondLoupeFacet = (await ethers.getContractAt(
      "DiamondLoupeFacet",
      aavegotchiDiamondAddress
    )) as DiamondLoupeFacet;

    aavegotchiFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      aavegotchiDiamondAddress
    )) as AavegotchiFacet;

    shopFacet = (await ethers.getContractAt(
      "ShopFacet",
      aavegotchiDiamondAddress
    )) as ShopFacet;

    aavegotchiGameFacet = (await ethers.getContractAt(
      "AavegotchiGameFacet",
      aavegotchiDiamondAddress
    )) as AavegotchiGameFacet;

    vrfFacet = (await ethers.getContractAt(
      "VrfFacet",
      aavegotchiDiamondAddress
    )) as VrfFacet;

    svgFacet = (await ethers.getContractAt(
      "SvgFacet",
      aavegotchiDiamondAddress
    )) as SvgFacet;

    svgViewsFacet = (await ethers.getContractAt(
      "SvgViewsFacet",
      aavegotchiDiamondAddress
    )) as SvgViewsFacet;
  }

  async function getTokenId() {
    const tokenIds = await aavegotchiFacet.tokenIdsOfOwner(owner.address);
    return tokenIds[0];
  }

  // this.timeout(300000)
  before(async function () {
    const {
      aavegotchiDiamond,
      forgeDiamond,
      wearableDiamond,
      testGhstContractAddress,
    } = await deployFullDiamond(true);

    aavegotchiDiamondAddress = aavegotchiDiamond.address;
    forgeDiamondAddress = forgeDiamond.address;
    wearableDiamondAddress = wearableDiamond.address;
    ghstContractAddress = testGhstContractAddress;

    await setupFacets();

    console.log("Diamond Address:", aavegotchiDiamondAddress);

    [owner, user1, user2] = await ethers.getSigners();
  });

  it("should deploy all of the facets of aavegotchi diamond", async function () {
    const facets = await diamondLoupeFacet.facets();
    expect(facets.length).to.equal(29);
  });

  describe("Minting Portals", async function () {
    it("should have a haunt", async function () {
      const haunt = await aavegotchiGameFacet.currentHaunt();
      console.log(haunt);
      expect(haunt.hauntId_).to.equal(2);
    });

    it("should mint a portal", async function () {
      await shopFacet.mintPortals(owner.address, 10);
      const balance = await aavegotchiFacet.balanceOf(owner.address);
      console.log(balance);
      expect(balance).to.equal(10);
    });

    it("should open a portal", async function () {
      const tokenId = await getTokenId();
      await vrfFacet.connect(owner).openPortals([tokenId]);
      const portal = await aavegotchiFacet.getAavegotchi(tokenId);

      expect(portal.status).to.equal(2);
    });

    it("should fetch portal svgs", async function () {
      const tokenId = await getTokenId();
      const portalSvgs = await svgFacet.portalAavegotchisSvg(tokenId);
      console.log(portalSvgs);
    });

    it("should claim an aavegotchi from the portal", async function () {
      const tokenId = await getTokenId();
      const option = 0;

      await aavegotchiGameFacet.connect(owner).claimAavegotchi(tokenId, option);

      const aavegotchi = await aavegotchiFacet.getAavegotchi(tokenId);
      expect(aavegotchi.status).to.equal(3);
    });

    it("should name aavegotchi", async function () {
      const tokenId = await getTokenId();
      await aavegotchiGameFacet
        .connect(owner)
        .setAavegotchiName(tokenId, "test");
      const aavegotchi = await aavegotchiFacet.getAavegotchi(tokenId);
      expect(aavegotchi.name).to.equal("test");
    });

    it("should mint some wearables", async function () {
      const erc20Contract = await ethers.getContractAt(
        "ERC20Token",
        ghstContractAddress
      );
      await erc20Contract.connect(owner).mint();

      const ghstBalance = await erc20Contract.balanceOf(owner.address);
      console.log("ghstBalance", ghstBalance);

      await erc20Contract
        .connect(owner)
        .approve(aavegotchiDiamondAddress, ghstBalance);

      console.log("approved");

      await shopFacet.purchaseItemsWithGhst(
        owner.address,
        [60, 61, 62],
        [1, 1, 1]
      );

      const balance = await itemsFacet.itemBalances(owner.address);
      console.log(balance);
      expect(balance[0].balance).to.equal(1);
      expect(balance[1].balance).to.equal(1);
      expect(balance[2].balance).to.equal(1);
    });

    // it("should equip a wearable", async function () {
    //   const tokenId = await getTokenId();

    //   let wearableIds: [
    //     BigNumberish,
    //     BigNumberish,
    //     BigNumberish,
    //     BigNumberish,
    //     BigNumberish,
    //     BigNumberish,
    //     BigNumberish,
    //     BigNumberish,
    //     BigNumberish,
    //     BigNumberish,
    //     BigNumberish,
    //     BigNumberish,
    //     BigNumberish,
    //     BigNumberish,
    //     BigNumberish,
    //     BigNumberish
    //   ] = [0, 0, 0, "60", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    //   await itemsFacet.connect(owner).equipWearables(tokenId, wearableIds);
    //   const aavegotchi = await aavegotchiFacet.getAavegotchi(tokenId);
    //   expect(aavegotchi.equippedWearables[3]).to.equal(60);
    // });

    it("can get onchain svg", async function () {
      const tokenId = await getTokenId();
      await svgFacet.getAavegotchiSvg(tokenId);
      const svg = await svgViewsFacet.getAavegotchiSideSvgs(tokenId);
      console.log(svg);
    });
  });
});
