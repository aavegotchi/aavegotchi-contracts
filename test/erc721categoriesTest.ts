import { ethers, network } from "hardhat";
import { expect } from "chai";
import {
  AavegotchiFacet,
  ERC721MarketplaceFacet,
  GHSTFacet,
} from "../typechain";
import { ERC721Category } from "../types";
import { upgrade } from "../scripts/upgrades/upgrade-erc721categories";
import {
  impersonate,
  maticDiamondAddress,
  maticRealmDiamondAddress,
} from "../scripts/helperFunctions";
import { listenerCount, listeners } from "process";

describe("Testing ERC721 categories", async function () {
  this.timeout(200000000);
  const diamondAddress = maticDiamondAddress;
  const itemManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";
  const testAddress2 = "0xe768FF81990E7Ac73C18a2eCbf038815023599Dc";
  const gbm = "0xa44c8e0eCAEFe668947154eE2b803Bd4e6310EFe";
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
  it("ERC721 categories should be set during upgade", async function () {
    ERC721MarketplaceFacet = await impersonate(
      itemManager,
      ERC721MarketplaceFacet,
      ethers,
      network
    );

    const foundCategories = await ERC721MarketplaceFacet.getERC721Category(
      maticRealmDiamondAddress,
      "59"
    );
    expect(foundCategories).to.equal(4);
  });
  it("Aavegotchi categories should still be the same", async function () {
    const unopenedPortal = await ERC721MarketplaceFacet.getERC721Category(
      maticDiamondAddress,
      "2"
    );
    expect(unopenedPortal).to.equal(0);

    const gotchiCategory = await ERC721MarketplaceFacet.getERC721Category(
      maticDiamondAddress,
      "1484"
    );
    expect(gotchiCategory).to.equal(3);
  });
  it("Can list different ERC721, including REALM", async function () {
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

    //Listing REALM parcels from GBM (current owner)
    let erc721 = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      maticRealmDiamondAddress
    )) as AavegotchiFacet;
    erc721 = await impersonate(gbm, erc721, ethers, network);
    await erc721.setApprovalForAll(diamondAddress, true);
    let erc20 = await ethers.getContractAt(
      "GHSTFacet",
      "0x385eeac5cb85a38a9a07a70c73e0a3271cfb54a7"
    );
    erc20 = (await impersonate(gbm, erc20, ethers, network)) as GHSTFacet;
    await erc20.approve(diamondAddress, ethers.utils.parseEther("100000000"));

    ERC721MarketplaceFacet = await impersonate(
      gbm,
      ERC721MarketplaceFacet,
      ethers,
      network
    );
    await ERC721MarketplaceFacet.addERC721Listing(
      maticRealmDiamondAddress,
      "59",
      ethers.utils.parseEther("1000")
    );

    const listings = await ERC721MarketplaceFacet.getOwnerERC721Listings(
      gbm,
      "4",
      "listed",
      100
    );

    expect(listings[0].category).to.equal(4);
    expect(listings[0].priceInWei).to.equal(ethers.utils.parseEther("1000"));

    // console.log("listings:", listings);
  });

  it("Transferring REALM parcel should invalidate listing (requires Aavegotchi Realm Diamond upgrade on localhost)", async function () {
    //Listing REALM parcels from GBM (current owner)
    const gbm = "0xa44c8e0eCAEFe668947154eE2b803Bd4e6310EFe";
    let erc721 = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      maticRealmDiamondAddress
    )) as AavegotchiFacet;
    erc721 = await impersonate(gbm, erc721, ethers, network);

    await erc721["safeTransferFrom(address,address,uint256)"](
      gbm,
      testAddress,
      59
    );

    ERC721MarketplaceFacet = await impersonate(
      testAddress,
      ERC721MarketplaceFacet,
      ethers,
      network
    );

    const listings = await ERC721MarketplaceFacet.getOwnerERC721Listings(
      gbm,
      "4",
      "listed",
      "100"
    );
    expect(listings.length).to.equal(0);
  });

  it("Cannot duplicate a category for another contract address", async function () {
    ERC721MarketplaceFacet = await impersonate(
      itemManager,
      ERC721MarketplaceFacet,
      ethers,
      network
    );
    await expect(
      ERC721MarketplaceFacet.setERC721Categories([
        {
          erc721TokenAddress: testAddress,
          category: 4,
        },
      ])
    ).to.be.revertedWith("ERC721Marketplace: Category has already been set");
  });

  it("Cannot create categories under 4", async function () {
    ERC721MarketplaceFacet = await impersonate(
      itemManager,
      ERC721MarketplaceFacet,
      ethers,
      network
    );
    await expect(
      ERC721MarketplaceFacet.setERC721Categories([
        {
          erc721TokenAddress: testAddress,
          category: 3,
        },
      ])
    ).to.be.revertedWith("ERC721Marketplace: Added category should be above 3");
  });
  it("Purchase Realm on the baazaar", async function () {
    let erc721 = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      maticRealmDiamondAddress
    )) as AavegotchiFacet;
    erc721 = await impersonate(gbm, erc721, ethers, network);
    await erc721["safeTransferFrom(address,address,uint256)"](
      gbm,
      testAddress2,
      3180
    );
    erc721 = await impersonate(testAddress2, erc721, ethers, network);
    await erc721.setApprovalForAll(diamondAddress, true);

    let erc20 = await ethers.getContractAt(
      "GHSTFacet",
      "0x385eeac5cb85a38a9a07a70c73e0a3271cfb54a7"
    );
    erc20 = (await impersonate(
      testAddress2,
      erc20,
      ethers,
      network
    )) as GHSTFacet;
    await erc20.approve(diamondAddress, ethers.utils.parseEther("100000000"));

    ERC721MarketplaceFacet = await impersonate(
      testAddress2,
      ERC721MarketplaceFacet,
      ethers,
      network
    );
    await ERC721MarketplaceFacet.addERC721Listing(
      maticRealmDiamondAddress,
      "3180",
      ethers.utils.parseEther("100")
    );
    const listings = await ERC721MarketplaceFacet.getOwnerERC721Listings(
      testAddress2,
      "4",
      "listed",
      100
    );
    ERC721MarketplaceFacet = await impersonate(
      testAddress,
      ERC721MarketplaceFacet,
      ethers,
      network
    );
    expect(listings.length).to.equal(1);
    const ownerPreExecution = await erc721.ownerOf(3180);
    expect(ownerPreExecution).to.equal(testAddress2);
    await ERC721MarketplaceFacet.executeERC721Listing(listings[0].listingId);
    const ownerPostExecution = await erc721.ownerOf(3180);
    expect(ownerPostExecution).to.equal(testAddress);
    const listingsSeller = await ERC721MarketplaceFacet.getOwnerERC721Listings(
      testAddress2,
      "4",
      "listed",
      100
    );
    const listingsBuyer = await ERC721MarketplaceFacet.getOwnerERC721Listings(
      testAddress,
      "4",
      "listed",
      100
    );
    expect(listingsSeller.length).to.equal(0);
    expect(listingsBuyer.length).to.equal(0);
  });
});
