/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
import { ERC1155MarketplaceFacet, MarketplaceGetterFacet } from "../../typechain";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  aavegotchiDiamondAddress,
  buildCommitment,
} from "./helpers";
import {
  aavegotchiDiamondAddressMatic
} from "../../helpers/constants";
import { impersonate } from "../../scripts/helperFunctions";
import { RolesRegistryUnlistedBazaarTest } from "./deployTest";

const { expect } = chai;

describe("ItemsRolesRegistryFacet", async () => {
  let ItemsRolesRegistryFacet: Contract;
  let grantor: SignerWithAddress;
  let erc1155MarketWithItemSeller: ERC1155MarketplaceFacet;
  let marketplaceGetter: MarketplaceGetterFacet;
  const erc1155Id = 37; // Should be erc1155/item
  const test1155Quantity = 3;
  const diamondAddress = aavegotchiDiamondAddressMatic;
  const itemOwnerAddress = "0x983b36872ae1bbC40dD0A99c3ed98429FEa0EbD4"; // Should be Item owner
  const listingId = 368953;
 
  let snapshot: any;
  before(async () => {    
    const signers = await ethers.getSigners();
    grantor = signers[0];

    await RolesRegistryUnlistedBazaarTest();

    const erc1155MarketplaceFacet = (await ethers.getContractAt(
      "ERC1155MarketplaceFacet",
      diamondAddress
    )) as ERC1155MarketplaceFacet;

    erc1155MarketWithItemSeller = await impersonate(
      itemOwnerAddress,
      erc1155MarketplaceFacet,
      ethers,
      network
    );

    marketplaceGetter = (await ethers.getContractAt(
      "MarketplaceGetterFacet",
      diamondAddress
    )) as MarketplaceGetterFacet;


    snapshot = await ethers.provider.send("evm_snapshot", []);

    // -------------------------//--------------------
    // Roles Registry

    ItemsRolesRegistryFacet = await ethers.getContractAt(
      "ItemsRolesRegistryFacet",
      aavegotchiDiamondAddress,
    );

    ItemsRolesRegistryFacet = await impersonate(
      itemOwnerAddress,
      ItemsRolesRegistryFacet,
      ethers,
      network
    );
  
    // Ensure itemOwnerAddress has sufficient balance
    await network.provider.request({
      method: "hardhat_setBalance",
      params: [itemOwnerAddress, "0x1000000000000000000"], // Set balance to 1 ETH
    });
  });

  describe('commitTokens', async () => {
    after(async function () {
      await ethers.provider.send("evm_revert", [snapshot]);
    });
    it("Should delist ERC1155 From Bazaar when CommitTokens was called from Roles Registry", async function () {

      const commitment = buildCommitment({grantor: grantor.address})

      const listingBefore = await marketplaceGetter.getERC1155Listing(listingId);
      expect(listingBefore.quantity).to.equal(3); 

       await 
          ItemsRolesRegistryFacet.commitTokens(
            itemOwnerAddress,
            commitment.tokenAddress,
            erc1155Id,
            test1155Quantity,
        )

      const listingAfter = await marketplaceGetter.getERC1155Listing(listingId);
      expect(listingAfter.quantity).to.equal(0); 
    });
  })
});
