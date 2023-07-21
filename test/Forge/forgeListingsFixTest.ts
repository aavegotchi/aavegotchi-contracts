import { ethers, network } from "hardhat";
import { expect } from "chai";
import {
  ForgeFacet,
  ERC1155MarketplaceFacet,
  MarketplaceGetterFacet,
  ForgeTokenFacet,
  ERC20Token,
} from "../../typechain";
import {
  impersonate,
  maticDiamondAddress,
  maticForgeDiamond,
} from "../../scripts/helperFunctions";
import { upgradeForgeListingsFix } from "../../scripts/upgrades/forge/upgrade-forgeListingsFix";

describe("Testing Forge", async function () {
  // https://polygonscan.com/tx/0xcb1a065e9176cc733e7353346c8d0690b0813d4fcc03449dac0d5e9e59f77679
  const buggedERC1155Id = 249;
  const buggedERC1155Owner = "0xA5643D9B4A2049d578a690269Dbc13426b352672";
  const testGotchiId = 21107;

  const maticGhstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";
  const maticGltrAddress = "0x3801C3B3B5c98F88a9c9005966AA96aa440B9Afc";

  const ghstWhaleAddress = "0xb4473cfEeDC9a0E94612c6ce883677b63f830DB8";
  const gltrWhaleAddress = "0x118B427af645e5e696E6DA748BD66aC8E4f5E9A8";

  let erc1155MarketplaceFacet: ERC1155MarketplaceFacet;
  let marketplaceGetterFacet: MarketplaceGetterFacet;
  let forgeFacet: ForgeFacet;
  let forgeTokenFacet: ForgeTokenFacet;

  before(async function () {
    await upgradeForgeListingsFix();

    erc1155MarketplaceFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/ERC1155MarketplaceFacet.sol:ERC1155MarketplaceFacet",
      maticDiamondAddress
    )) as ERC1155MarketplaceFacet;
    marketplaceGetterFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/MarketplaceGetterFacet.sol:MarketplaceGetterFacet",
      maticDiamondAddress
    )) as MarketplaceGetterFacet;
    forgeFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/ForgeDiamond/facets/ForgeFacet.sol:ForgeFacet",
      maticForgeDiamond
    )) as ForgeFacet;
    forgeTokenFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/ForgeDiamond/facets/ForgeTokenFacet.sol:ForgeTokenFacet",
      maticForgeDiamond
    )) as ForgeTokenFacet;

    let ghstERC20 = (await ethers.getContractAt(
      "ERC20Token",
      maticGhstAddress
    )) as ERC20Token;
    ghstERC20 = await impersonate(ghstWhaleAddress, ghstERC20, ethers, network);
    await ghstERC20.transfer(
      buggedERC1155Owner,
      ethers.utils.parseEther("100")
    );

    let gltrERC20 = (await ethers.getContractAt(
      "ERC20Token",
      maticGltrAddress
    )) as ERC20Token;
    gltrERC20 = await impersonate(gltrWhaleAddress, gltrERC20, ethers, network);
    await gltrERC20.transfer(
      buggedERC1155Owner,
      ethers.utils.parseEther("500000")
    );
    await gltrERC20.approve(maticGltrAddress, "9999999999999999999999999999");
  });

  describe("Cancel current bugged forge listings", async function () {
    it("Should be canceled by anyone", async function () {
      let listing = await marketplaceGetterFacet.getERC1155ListingFromToken(
        maticForgeDiamond,
        buggedERC1155Id,
        buggedERC1155Owner
      );
      expect(listing.cancelled).to.be.equal(false);
      expect(listing.sold).to.be.equal(false);
      expect(listing.quantity.gt(0)).to.be.equal(true);

      await (
        await erc1155MarketplaceFacet.updateERC1155Listing(
          maticForgeDiamond,
          buggedERC1155Id,
          buggedERC1155Owner
        )
      ).wait();

      listing = await marketplaceGetterFacet.getERC1155Listing(
        listing.listingId
      );
      expect(listing.cancelled).to.be.equal(true);
      expect(listing.sold).to.be.equal(false);
      expect(listing.quantity.eq(0)).to.be.equal(true);
    });
  });

  describe("Cancel listing when forge wearable", async function () {
    it("Should ERC1155 listing should be canceled", async function () {
      forgeFacet = await impersonate(
        buggedERC1155Owner,
        forgeFacet,
        ethers,
        network
      );
      erc1155MarketplaceFacet = await impersonate(
        buggedERC1155Owner,
        erc1155MarketplaceFacet,
        ethers,
        network
      );

      await (
        await forgeFacet.smeltWearables([buggedERC1155Id], [testGotchiId])
      ).wait();
      expect(
        await forgeTokenFacet.balanceOf(buggedERC1155Owner, buggedERC1155Id)
      ).to.be.equal(1);

      const receipt = await (
        await erc1155MarketplaceFacet.setERC1155Listing(
          maticForgeDiamond,
          buggedERC1155Id,
          1,
          ethers.utils.parseEther("100")
        )
      ).wait();
      const event = receipt!.events!.find(
        (e: any) => e.event === "ERC1155ListingAdd"
      );
      const listingId = event!.args!.listingId;
      expect(event!.args!.seller).to.be.equal(buggedERC1155Owner);
      expect(event!.args!.erc1155TypeId).to.be.equal(buggedERC1155Id);

      let listing = await marketplaceGetterFacet.getERC1155ListingFromToken(
        maticForgeDiamond,
        buggedERC1155Id,
        buggedERC1155Owner
      );
      expect(listing.listingId).to.be.equal(listingId);
      expect(listing.cancelled).to.be.equal(false);
      expect(listing.sold).to.be.equal(false);
      expect(listing.quantity.gt(0)).to.be.equal(true);

      const rsm = 5; // rarityScoreModifier for buggedERC1155Id
      await (
        await forgeFacet.forgeWearables(
          [buggedERC1155Id],
          [testGotchiId],
          [await forgeFacet.forgeTime(testGotchiId, rsm)]
        )
      ).wait();

      listing = await marketplaceGetterFacet.getERC1155Listing(listingId);
      expect(listing.cancelled).to.be.equal(true);
      expect(listing.sold).to.be.equal(false);
      expect(listing.quantity.eq(0)).to.be.equal(true);
    });
  });
});
