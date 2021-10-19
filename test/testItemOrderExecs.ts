/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import { upgrade } from "../scripts/upgrades/upgradeItemMarketPlace";
import { impersonate } from "../scripts/helperFunctions";
import {
  ERC721MarketplaceFacet,
  GHSTFacet,
  ERC1155MarketplaceFacet,
} from "../typechain";
import { expect } from "chai";

describe("Testing Item Order Execution Rules", async function () {
  this.timeout(300000);
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  const ghstHolder = "0x13816f65ba8195768e6825eb774fd3c6a05a0ac8";
  const ghstToken = "0x385eeac5cb85a38a9a07a70c73e0a3271cfb54a7";
  let GHSTFacet: GHSTFacet;
  let ERC721MarketplaceFacet: ERC721MarketplaceFacet;
  let ERC1155MarketplaceFacet: ERC1155MarketplaceFacet;

  // this.timeout(300000)
  before(async function () {
    await upgrade();

    ERC721MarketplaceFacet = (await ethers.getContractAt(
      "ERC721MarketplaceFacet",
      diamondAddress
    )) as ERC721MarketplaceFacet;

    ERC721MarketplaceFacet = await impersonate(
      ghstHolder,
      ERC721MarketplaceFacet,
      ethers,
      network
    );

    ERC1155MarketplaceFacet = (await ethers.getContractAt(
      "ERC1155MarketplaceFacet",
      diamondAddress
    )) as ERC1155MarketplaceFacet;

    ERC1155MarketplaceFacet = await impersonate(
      ghstHolder,
      ERC1155MarketplaceFacet,
      ethers,
      network
    );

    GHSTFacet = (await ethers.getContractAt(
      "GHSTFacet",
      ghstToken
    )) as GHSTFacet;
    GHSTFacet = await impersonate(ghstHolder, GHSTFacet, ethers, network);
    await GHSTFacet.approve(diamondAddress, "10000000000000000000000000000");
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
        141910,
        15518,
        "1200000000000000"
      )
    ).to.be.revertedWith(
      "ERC721Marketplace:Provided amount does not match item amount in listing"
    );
  });

  it("Should revert if tokenId provided is incorrect", async function () {
    await expect(
      ERC721MarketplaceFacet.executeERC721Listing(
        141910,
        15510,
        "875000000000000000000"
      )
    ).to.be.revertedWith(
      "ERC721Marketplace: provided tokenId does not match tokenId in listing"
    );
  });

  it("Should execute listing when supplied args are correct", async function () {
    await ERC721MarketplaceFacet.executeERC721Listing(
      141910,
      15518,
      "875000000000000000000"
    );
  });

  //ERC1155 tests
  it("Should revert if wrong price is provided ", async function () {
    await expect(
      ERC1155MarketplaceFacet.executeERC1155Listing(
        202820,
        1,
        "875000000000000000000",
        245,
        diamondAddress
      )
    ).to.be.revertedWith("ERC1155Marketplace: wrong price or price changed");
  });

  it("Should revert if wrong itemId is provided ", async function () {
    await expect(
      ERC1155MarketplaceFacet.executeERC1155Listing(
        202820,
        1,
        "395000000000000000000",
        246,
        diamondAddress
      )
    ).to.be.revertedWith("ERC1155Marketplace: listing typeId incorrect");
  });

  it("Should revert if wrong quantity is provided ", async function () {
    await expect(
      ERC1155MarketplaceFacet.executeERC1155Listing(
        202820,
        10,
        "395000000000000000000",
        245,
        diamondAddress
      )
    ).to.be.revertedWith(
      "ERC1155Marketplace: quantity is greater than listing"
    );
  });

  it("Should execute listing when provided args are correct", async function () {
    await ERC1155MarketplaceFacet.executeERC1155Listing(
      202820,
      1,
      "395000000000000000000",
      245,
      diamondAddress
    );
  });
});

// 202820;
// 1;
// 395;
// 245;
// diamond;
