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
    const gbm = "0xa44c8e0eCAEFe668947154eE2b803Bd4e6310EFe";
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

  it("Transferring REALM parcel should invalidate listing", async function () {
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
    console.log("listings:", listings);
    expect(listings.length).to.equal(0);
  });
});
