/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import { upgrade } from "../scripts/upgrades/upgrade-baazaarRecipient";
import {
  ERC1155MarketplaceFacet,
  ERC721MarketplaceFacet,
  IERC20,
} from "../typechain";
import {
  aavegotchiDAOAddress,
  aavegotchiDiamondAddressMatic,
  ghstAddress,
  pixelcraftAddress,
  playerRewardsAddress,
} from "../helpers/constants";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { impersonate, maticDiamondAddress } from "../scripts/helperFunctions";

let ghst: IERC20;

async function getGHSTBalance(target: string) {
  ghst = (await ethers.getContractAt(
    "contracts/shared/interfaces/IERC20.sol:IERC20",
    ghstAddress
  )) as IERC20;

  return ghst.balanceOf(target);
}

describe("Testing Baazaar Recipient", async function () {
  //this.timeout(300000);
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  const recipient = "0x875425AF9bEA816F87cec7622b49F434Fb6A8166";
  const ghstOwner = "0xbd3183e633CA6C5065a8A4693923B3CDE9E5175f";
  let erc721Facet: ERC721MarketplaceFacet;
  let erc1155Facet: ERC1155MarketplaceFacet;
  const ERC721ListingId = 232336;
  const ERC1155ListingId = 313321;

  // this.timeout(300000)
  before(async function () {
    // await upgrade();
    const signer = await ethers.getSigner(ghstOwner);
    erc721Facet = (await ethers.getContractAt(
      "ERC721MarketplaceFacet",
      diamondAddress,
      signer
    )) as ERC721MarketplaceFacet;

    erc1155Facet = (await ethers.getContractAt(
      "ERC1155MarketplaceFacet",
      diamondAddress,
      signer
    )) as ERC1155MarketplaceFacet;

    ghst = (await ethers.getContractAt(
      "contracts/shared/interfaces/IERC20.sol:IERC20",
      ghstAddress,
      signer
    )) as IERC20;

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [ghstOwner],
    });

    await network.provider.request({
      method: "hardhat_setBalance",
      params: [ghstOwner, "0x1000000000000000000000000000000000000000"],
    });
    //aprprove
    await ghst.approve(maticDiamondAddress, ethers.utils.parseEther("1000"));
  });

  it("ERC721 Profit Share is executed according to proper proportions and receives correct # of NFTs", async function () {
    const listingDetails = await erc721Facet.getERC721Listing(ERC721ListingId);
    const sellerGhstBalanceBefore = await getGHSTBalance(listingDetails.seller);
    const pixelCraftBalanceBefore = await getGHSTBalance(pixelcraftAddress);
    const DAOBalanceBefore = await getGHSTBalance(aavegotchiDAOAddress);
    const erc721 = await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      aavegotchiDiamondAddressMatic
    );
    const portalbalBefore = await erc721.balanceOf(recipient);
    const playeRewardsGhstBalanceBefore = await getGHSTBalance(
      playerRewardsAddress
    );
    //execute erc721 listing
    await erc721Facet.executeERC721ListingToRecipient(
      ERC721ListingId,
      diamondAddress,
      listingDetails.priceInWei,
      listingDetails.erc721TokenId,
      recipient
    );

    const sellerGhstBalanceAfter = await getGHSTBalance(listingDetails.seller);
    const pixelCraftBalanceAfter = await getGHSTBalance(pixelcraftAddress);
    const DAOBalanceAfter = await getGHSTBalance(aavegotchiDAOAddress);
    const playeRewardsGhstBalanceAfter = await getGHSTBalance(
      playerRewardsAddress
    );
    const portalbalAfter = await erc721.balanceOf(recipient);
    //96.5% to seller
    expect(sellerGhstBalanceAfter).to.equal(
      sellerGhstBalanceBefore.add(listingDetails.priceInWei.mul(965).div(1000))
    );

    //1% to dao
    expect(DAOBalanceAfter).to.equal(
      DAOBalanceBefore.add(listingDetails.priceInWei.div(100))
    );

    //2% to PC
    expect(pixelCraftBalanceAfter).to.equal(
      pixelCraftBalanceBefore.add(listingDetails.priceInWei.mul(2).div(100))
    );

    // 0.5% to playerRewardsAddress
    expect(playeRewardsGhstBalanceAfter).to.equal(
      playeRewardsGhstBalanceBefore.add(listingDetails.priceInWei.div(200))
    );

    //has one portal more
    expect(portalbalAfter).to.equal(portalbalBefore.add(1));
    //confirm ownership
    expect(await erc721.ownerOf(listingDetails.erc721TokenId)).to.equal(
      recipient
    );
  });
  // it("ERC721 Recipient receives proper # of NFTs", async function () {});
  it("ERC1155 Profit Share is executed according to proper proportions", async function () {
    const listingDetails = await erc1155Facet.getERC1155Listing(
      ERC1155ListingId
    );
    const sellerGhstBalanceBefore = await getGHSTBalance(listingDetails.seller);
    const pixelCraftBalanceBefore = await getGHSTBalance(pixelcraftAddress);
    const DAOBalanceBefore = await getGHSTBalance(aavegotchiDAOAddress);
    const erc1155 = await ethers.getContractAt(
      "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      "0x19f870bD94A34b3adAa9CaA439d333DA18d6812A"
    );
    const itemBalBefore = await erc1155.balanceOf(
      recipient,
      listingDetails.erc1155TypeId
    );
    const playeRewardsGhstBalanceBefore = await getGHSTBalance(
      playerRewardsAddress
    );
    //execute erc1155 listing
    await erc1155Facet.executeERC1155ListingToRecipient(
      ERC1155ListingId,
      listingDetails.erc1155TokenAddress,
      listingDetails.erc1155TypeId,
      listingDetails.quantity,
      listingDetails.priceInWei,
      recipient
    );

    const sellerGhstBalanceAfter = await getGHSTBalance(listingDetails.seller);
    const pixelCraftBalanceAfter = await getGHSTBalance(pixelcraftAddress);
    const DAOBalanceAfter = await getGHSTBalance(aavegotchiDAOAddress);
    const playeRewardsGhstBalanceAfter = await getGHSTBalance(
      playerRewardsAddress
    );
    const itemBalAfter = await erc1155.balanceOf(
      recipient,
      listingDetails.erc1155TypeId
    );
    //96.5% to seller
    expect(sellerGhstBalanceAfter).to.equal(
      sellerGhstBalanceBefore.add(
        listingDetails.priceInWei
          .mul(965)
          .div(1000)
          .mul(listingDetails.quantity)
      )
    );

    //1% to dao
    expect(DAOBalanceAfter).to.equal(
      DAOBalanceBefore.add(
        listingDetails.priceInWei.div(100).mul(listingDetails.quantity)
      )
    );

    //2% to PC
    expect(pixelCraftBalanceAfter).to.equal(
      pixelCraftBalanceBefore.add(
        listingDetails.priceInWei.mul(2).div(100).mul(listingDetails.quantity)
      )
    );

    // 0.5% to playerRewardsAddress
    expect(playeRewardsGhstBalanceAfter).to.equal(
      playeRewardsGhstBalanceBefore.add(
        listingDetails.priceInWei.div(200).mul(listingDetails.quantity)
      )
    );

    //confirm item amount is correctly transferred
    expect(itemBalAfter).to.equal(itemBalBefore.add(listingDetails.quantity));
  });
  // it("ERC1155 Recipient receives proper # of NFTs", async function () {});
});
