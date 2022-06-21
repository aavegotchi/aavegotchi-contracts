/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import { upgrade } from "../scripts/upgrades/upgrade-batchUpdateItemPrice";
import { ERC1155MarketplaceFacet, ERC721MarketplaceFacet } from "../typechain";
import { expect } from "chai";

describe("Testing Baazaar Recipient", async function () {
  this.timeout(300000);
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let erc721Facet: ERC721MarketplaceFacet;
  let erc1155Facet: ERC1155MarketplaceFacet;

  // this.timeout(300000)
  before(async function () {
    await upgrade();

    erc721Facet = (await ethers.getContractAt(
      "ERC721MarketplaceFacet",
      diamondAddress
    )) as ERC721MarketplaceFacet;

    erc1155Facet = (await ethers.getContractAt(
      "ERC1155MarketplaceFacet",
      diamondAddress
    )) as ERC1155MarketplaceFacet;
  });

  it("Profit Share is executed according to proper proportions", async function () {});
  it("Recipient receives proper # of NFTs", async function () {});
});
