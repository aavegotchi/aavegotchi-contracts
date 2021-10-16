/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import { upgrade } from "../scripts/upgrades/upgradeERC721MarketPlace";
import { impersonate } from "../scripts/helperFunctions";
import { ERC721MarketplaceFacet, GHSTFacet } from "../typechain";
import { expect } from "chai";

describe("Testing ERC721 Order Reverts", async function () {
  this.timeout(300000);
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let ghstHolder = "0x13816f65ba8195768e6825eb774fd3c6a05a0ac8";
  let GHSTFacet: GHSTFacet;
  let ERC721MarketplaceFacet: ERC721MarketplaceFacet;

  // this.timeout(300000)
  before(async function () {
    await upgrade();

    ERC721MarketplaceFacet = (await ethers.getContractAt(
      "ERC721MarketplaceFacet",
      diamondAddress
    )) as ERC721MarketplaceFacet;

    GHSTFacet = (await ethers.getContractAt(
      "GHSTFacet",
      diamondAddress
    )) as GHSTFacet;
  });

  it("Should revert if amount provided is incorrect", async function () {
    ERC721MarketplaceFacet = await impersonate(
      ghstHolder,
      ERC721MarketplaceFacet,
      ethers,
      network
    );

    await expect(
      ERC721MarketplaceFacet.executeERC721Listing(
        140796,
        20649,
        "1200000000000000"
      )
    ).to.be.revertedWith(
      "ERC721Marketplace:Provided amount does not match item amount in listing"
    );
  });

  it("Should revert if tokenId provided is incorrect", async function () {
    ERC721MarketplaceFacet = await impersonate(
      ghstHolder,
      ERC721MarketplaceFacet,
      ethers,
      network
    );

    await expect(
      ERC721MarketplaceFacet.executeERC721Listing(
        140796,
        2049,
        "1200000000000000"
      )
    ).to.be.revertedWith(
      "ERC721Marketplace: provided tokenId does not match tokenId in listing"
    );
  });
});
