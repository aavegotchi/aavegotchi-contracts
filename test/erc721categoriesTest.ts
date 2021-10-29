import { ethers, network } from "hardhat";
import { expect } from "chai";
import { ERC721MarketplaceFacet } from "../typechain";
import { ERC721Category } from "../types";
import { upgrade } from "../scripts/upgrades/upgrade-erc721categories";
import {
  impersonate,
  maticDiamondAddress,
  maticRealmDiamondAddress,
} from "../scripts/helperFunctions";

describe("Testing ERC721 categories", async function () {
  this.timeout(200000000);
  const diamondAddress = maticDiamondAddress;
  const itemManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";
  const h1Portal = 5181;
  const h2Gotchi = 22306;
  let ERC721MarketplaceFacet: ERC721MarketplaceFacet;

  before(async function () {
    await upgrade();
    ERC721MarketplaceFacet = (await ethers.getContractAt(
      "ERC721MarketplaceFacet",
      diamondAddress
    )) as ERC721MarketplaceFacet;
  });
  it("Set ERC721 categories", async function () {
    const categories: ERC721Category[] = [];
    categories.push({
      erc721TokenAddress: diamondAddress,
      category: 0,
    });
    categories.push({
      erc721TokenAddress: maticRealmDiamondAddress,
      category: 4,
    });
    await expect(
      ERC721MarketplaceFacet.setERC721Categories(categories)
    ).to.be.revertedWith(
      "LibAppStorage: only an ItemManager can call this function"
    );
    ERC721MarketplaceFacet = await impersonate(
      itemManager,
      ERC721MarketplaceFacet,
      ethers,
      network
    );
    await ERC721MarketplaceFacet.setERC721Categories(categories);
  });
  it("List different ERC721", async function () {
    ERC721MarketplaceFacet = await impersonate(
      testAddress,
      ERC721MarketplaceFacet,
      ethers,
      network
    );
    await ERC721MarketplaceFacet.addERC721Listing(
      diamondAddress,
      h1Portal,
      ethers.utils.parseUnits("2000")
    );
    await ERC721MarketplaceFacet.addERC721Listing(
      diamondAddress,
      h2Gotchi,
      ethers.utils.parseUnits("4000")
    );
  });
});
