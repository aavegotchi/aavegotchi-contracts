import { ethers, network } from "hardhat";
import { expect } from "chai";
import { ERC1155MarketplaceFacet, ERC20Token } from "../typechain";
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

    await upgrade();
  });

  it.only("Should allow contractOwner to assign an erc1155TypeId to pay royalties to an address", async function () {
    erc1155MarketplaceFacet = await impersonate(
      itemManager,
      erc1155MarketplaceFacet,
      ethers,
      network
    );

    royaltiesArg.push({
      erc1155TypeId: 11,
      royaltyRecipient: royaltyAddress,
      royaltyPercentage: 10,
    });

    await erc1155MarketplaceFacet.setERC1155Royalty(royaltiesArg);

    let beforeBalance = await erc20Token.balanceOf(royaltyAddress);
    console.log("Royalty Recipient Before Balance: ", beforeBalance.toString());

    const erc1155Listings = await erc1155MarketplaceFacet.getERC1155Listings(
      0,
      "listed",
      10
    );
    console.log("Listings: ", erc1155Listings.toString());
  });
});
