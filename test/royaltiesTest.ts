import { ethers, network } from "hardhat";
import { expect } from "chai";
import { ERC1155MarketplaceFacet, ERC20Token, ItemsFacet } from "../typechain";
import { upgrade } from "../scripts/upgrades/upgrade-royalties";
import {
  maticDiamondAddress,
  impersonate,
  itemManager,
} from "../scripts/helperFunctions";
import { Signer } from "@ethersproject/abstract-signer";

describe("Testing Royalties", async function () {
  this.timeout(200000000);

  const royaltyAddress = "0x0d2026b3EE6eC71FC6746ADb6311F6d3Ba1C000B";
  const ghstWhale = "0xBC67F26c2b87e16e304218459D2BB60Dac5C80bC";

  let erc1155MarketplaceFacet: ERC1155MarketplaceFacet;
  let erc20Token: ERC20Token;
  let itemFacet: ItemsFacet;
  let signer: Signer;

  const royaltiesArg: any[] = [];

  before(async function () {
    signer = await ethers.getSigner(maticDiamondAddress);

    erc1155MarketplaceFacet = (await ethers.getContractAt(
      "ERC1155MarketplaceFacet",
      maticDiamondAddress,
      signer
    )) as ERC1155MarketplaceFacet;

    erc20Token = (await ethers.getContractAt(
      "ERC20Token",
      maticDiamondAddress,
      signer
    )) as ERC20Token;

    itemFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      maticDiamondAddress,
      signer
    )) as ItemsFacet;

    await upgrade();
  });

  it.only("Should allow contractOwner to assign an erc1155TypeId to pay royalties to an address", async function () {
    erc1155MarketplaceFacet = await impersonate(
      itemManager,
      erc1155MarketplaceFacet,
      ethers,
      network
    );

    let beforeBalance = await erc20Token.balanceOf(royaltyAddress);
    console.log("Royalty Recipient Before Balance: ", beforeBalance.toString());

    const erc1155Listings = await erc1155MarketplaceFacet.getERC1155Listings(
      0,
      "listed",
      10
    );
    /* console.log("Listings: ", erc1155Listings.toString()); */
    let itemId = parseInt(erc1155Listings[0].erc1155TypeId.toString());
    console.log("item Id: ", itemId);
    let listingId = erc1155Listings[0].listingId.toString();
    console.log("listing Id: ", listingId);
    let itemCost = erc1155Listings[0].priceInWei.toString();
    console.log("listing price: ", itemCost);

    /*     let itemType = await itemFacet.getItemType(itemId);
    console.log("Royalty Percentage: ", itemType.royaltyPercentage.toString());
    console.log("Royalty Address: ", itemType.royaltyRecipient.toString()); */

    royaltiesArg.push({
      erc1155TypeId: itemId,
      royaltyRecipient: royaltyAddress,
      royaltyPercentage: 10,
    });

    await erc1155MarketplaceFacet.setERC1155Royalty(royaltiesArg);

    let royaltyInfo = await erc1155MarketplaceFacet.getRoyaltiesInfo(
      itemId,
      itemCost
    );
    console.log("Royalties Address: ", royaltyInfo.royaltyRecipient);
    console.log("Royalties Percentage: ", royaltyInfo.royaltyPercentage);
    console.log("Royalties Payout: ", royaltyInfo.payout.toString());

    /*     let afterItemType = await itemFacet.getItemType(itemId);
    console.log(
      "Change Royalty Address: ",
      afterItemType.royaltyRecipient.toString()
    );
    console.log(
      "Change Royalty Percentage: ",
      afterItemType.royaltyPercentage.toString()
    ); */

    await network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [itemManager],
    });

    erc1155MarketplaceFacet = await impersonate(
      ghstWhale,
      erc1155MarketplaceFacet,
      ethers,
      network
    );

    await erc1155MarketplaceFacet.executeERC1155Listing(listingId, 1, itemCost);
    console.log("Sale completed for listingId: ", listingId);
    console.log("Sale completed for itemId: ", itemId);

    let afterBalance = await erc20Token.balanceOf(royaltyAddress);
    console.log("Royalty Recipient After Balance: ", afterBalance.toString());
  });
});
