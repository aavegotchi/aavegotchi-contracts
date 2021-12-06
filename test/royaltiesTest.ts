import { ethers, network } from "hardhat";
import { expect } from "chai";
import { ERC1155MarketplaceFacet, GHSTFacet } from "../typechain";
import { upgrade } from "../scripts/upgrades/upgrade-royalties";
import {
  maticDiamondAddress,
  impersonate,
  itemManager,
} from "../scripts/helperFunctions";
import { Signer } from "@ethersproject/abstract-signer";

describe("Testing Royalties", async function () {
  this.timeout(200000000);

  const diamondAddress = maticDiamondAddress;
  const royaltyAddress: string = "0x0d2026b3EE6eC71FC6746ADb6311F6d3Ba1C000B";
  const ghstWhale: string = "0xBC67F26c2b87e16e304218459D2BB60Dac5C80bC";
  const gbm = "0xa44c8e0eCAEFe668947154eE2b803Bd4e6310EFe";
  const daoAddress = "0xb208f8BB431f580CC4b216826AFfB128cd1431aB";
  const rarityFarmingAddress = "0x27DF5C6dcd360f372e23d5e63645eC0072D0C098";
  const pixelCraftAddress = "0xD4151c984e6CF33E04FFAAF06c3374B2926Ecc64";

  let erc1155MarketplaceFacet: ERC1155MarketplaceFacet;

  let signer: Signer;

  before(async function () {
    signer = await ethers.getSigner(diamondAddress);

    erc1155MarketplaceFacet = (await ethers.getContractAt(
      "ERC1155MarketplaceFacet",
      diamondAddress,
      signer
    )) as ERC1155MarketplaceFacet;

    await upgrade();
  });

  it("Should allow contractOwner to assign royalties to an erc1155TypeId", async function () {
    erc1155MarketplaceFacet = await impersonate(
      itemManager,
      erc1155MarketplaceFacet,
      ethers,
      network
    );

    const erc1155Listings = await erc1155MarketplaceFacet.getERC1155Listings(
      0,
      "listed",
      10
    );

    let itemId = parseInt(erc1155Listings[0].erc1155TypeId.toString());
    console.log("item Id: ", itemId);
    let listingId = erc1155Listings[0].listingId.toString();
    console.log("listing Id: ", listingId);
    let itemCost = erc1155Listings[0].priceInWei.toString();
    console.log("listing price: ", itemCost);

    let royaltiesArg: any[] = [
      {
        erc1155TypeId: itemId,
        royaltyRecipient: royaltyAddress,
        royaltyPercentage: 9990000,
      },
    ];

    await erc1155MarketplaceFacet.setERC1155Royalty(royaltiesArg);

    let royaltyInfo = await erc1155MarketplaceFacet.getRoyaltiesInfo(
      itemId,
      itemCost
    );
    console.log("Royalties Address: ", royaltyInfo.royaltyRecipient);
    console.log(
      "Royalties Percentage: ",
      royaltyInfo.royaltyPercentage.toString()
    );
    console.log("Royalties Payout: ", royaltyInfo.payout.toString());

    expect(royaltyInfo.royaltyRecipient).to.equal(royaltyAddress);
    expect(royaltyInfo.royaltyPercentage).to.equal(
      royaltiesArg[0].royaltyPercentage
    );
    expect(royaltyInfo.payout.toString()).to.equal(
      (
        (parseInt(itemCost) * royaltiesArg[0].royaltyPercentage) /
        100000000
      ).toString()
    );
  });

  it("Should NOT allow contractOwner to assign royalties to an already assigned erc1155TypeId", async function () {
    const erc1155Listings = await erc1155MarketplaceFacet.getERC1155Listings(
      0,
      "listed",
      10
    );

    let itemId = parseInt(erc1155Listings[0].erc1155TypeId.toString());

    let royaltiesArg: any[] = [
      {
        erc1155TypeId: itemId,
        royaltyRecipient: royaltyAddress,
        royaltyPercentage: 9990000,
      },
    ];

    await expect(
      erc1155MarketplaceFacet.setERC1155Royalty(royaltiesArg)
    ).to.be.revertedWith("ERC1155 ID already pays royalties");
  });

  it("Should NOT allow contractOwner to assign royalties with royalties percentage over 10%", async function () {
    const erc1155Listings = await erc1155MarketplaceFacet.getERC1155Listings(
      0,
      "listed",
      10
    );

    let itemId = parseInt(erc1155Listings[1].erc1155TypeId.toString());

    let royaltiesArg: any[] = [
      {
        erc1155TypeId: itemId,
        royaltyRecipient: royaltyAddress,
        royaltyPercentage: 10000001,
      },
    ];

    await expect(
      erc1155MarketplaceFacet.setERC1155Royalty(royaltiesArg)
    ).to.be.revertedWith("Royalty Percentage is too high");
  });

  it("Should NOT allow an address that is NOT Owner Or ItemManager to assign royalties", async function () {
    erc1155MarketplaceFacet = await impersonate(
      royaltyAddress,
      erc1155MarketplaceFacet,
      ethers,
      network
    );

    const erc1155Listings = await erc1155MarketplaceFacet.getERC1155Listings(
      0,
      "listed",
      10
    );

    let itemId = parseInt(erc1155Listings[0].erc1155TypeId.toString());

    let royaltiesArg: any[] = [
      {
        erc1155TypeId: itemId,
        royaltyRecipient: royaltyAddress,
        royaltyPercentage: 9990000,
      },
    ];

    await expect(
      erc1155MarketplaceFacet.setERC1155Royalty(royaltiesArg)
    ).to.be.revertedWith(
      "LibAppStorage: only an Owner or ItemManager can call this function"
    );
  });

  it("Should pay royalties to an address", async function () {
    erc1155MarketplaceFacet = await impersonate(
      itemManager,
      erc1155MarketplaceFacet,
      ethers,
      network
    );

    const erc1155Listings = await erc1155MarketplaceFacet.getERC1155Listings(
      0,
      "listed",
      10
    );

    let itemId = parseInt(erc1155Listings[1].erc1155TypeId.toString());
    let listingId = erc1155Listings[1].listingId.toString();
    let itemCost = erc1155Listings[1].priceInWei.toString();

    let royaltiesArg: any[] = [
      {
        erc1155TypeId: itemId,
        royaltyRecipient: royaltyAddress,
        royaltyPercentage: 9990000,
      },
    ];

    await erc1155MarketplaceFacet.setERC1155Royalty(royaltiesArg);

    let erc20 = await ethers.getContractAt(
      "GHSTFacet",
      "0x385eeac5cb85a38a9a07a70c73e0a3271cfb54a7"
    );
    erc20 = (await impersonate(gbm, erc20, ethers, network)) as GHSTFacet;
    await erc20.approve(diamondAddress, ethers.constants.MaxUint256);

    let beforeBalance = await erc20.balanceOf(royaltyAddress);
    console.log("Royalty Recipient Before Balance: ", beforeBalance.toString());

    let royaltyInfo = await erc1155MarketplaceFacet.getRoyaltiesInfo(
      itemId,
      itemCost
    );

    erc1155MarketplaceFacet = await impersonate(
      ghstWhale,
      erc1155MarketplaceFacet,
      ethers,
      network
    );

    await erc1155MarketplaceFacet.executeERC1155Listing(listingId, 1, itemCost);
    console.log("Sale completed for listingId: ", listingId);
    console.log("Sale completed for itemId: ", itemId);

    let afterBalance = await erc20.balanceOf(royaltyAddress);
    console.log("Royalty Recipient After Balance: ", afterBalance.toString());

    expect(royaltyInfo.payout.toString()).to.equal(afterBalance.toString());
  });

  it("Should emit event RoyaltySet", async function () {
    erc1155MarketplaceFacet = await impersonate(
      itemManager,
      erc1155MarketplaceFacet,
      ethers,
      network
    );

    const erc1155Listings = await erc1155MarketplaceFacet.getERC1155Listings(
      0,
      "listed",
      10
    );

    let itemId = parseInt(erc1155Listings[2].erc1155TypeId.toString());

    let royaltiesArg: any[] = [
      {
        erc1155TypeId: itemId,
        royaltyRecipient: royaltyAddress,
        royaltyPercentage: 9990000,
      },
    ];

    await expect(erc1155MarketplaceFacet.setERC1155Royalty(royaltiesArg))
      .to.emit(erc1155MarketplaceFacet, "RoyaltySet")
      .withArgs(itemId, royaltyAddress, royaltiesArg[0].royaltyPercentage);
  });
});
