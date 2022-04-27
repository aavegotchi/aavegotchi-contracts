/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
import { upgrade } from "../scripts/upgrades/upgrade-gotchiLendingWhitelist";
import { impersonate } from "../scripts/helperFunctions";
import {
  AavegotchiFacet,
  AavegotchiGameFacet,
  GotchiLendingFacet,
  ERC20Token,
  ERC721MarketplaceFacet,
  WhitelistFacet,
} from "../typechain";
import { BigNumberish } from "ethers";

const { expect } = chai;

describe("Testing Aavegotchi Lending", async function () {
  this.timeout(300000);

  const listedFilter = ethers.utils.formatBytes32String("listed");
  const agreedFilter = ethers.utils.formatBytes32String("agreed");
  const ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";

  const collateral = "0x8df3aad3a84da6b69a4da8aec3ea40d9091b2ac4";

  const revenueTokens: string[] = [ghstAddress, collateral];
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  const claimerAddress = "0x3507e4978e0eb83315d20df86ca0b976c0e40ccb";
  const borrowerAddress = "0xb4473cfEeDC9a0E94612c6ce883677b63f830DB8"; // borrower should be GHST holder
  const nonGhstHolderAddress = "0x725Fe4790fC6435B5161f88636C2A50e43247A4b"; // GHST holder balance should be 0
  const nonWhitelistedAddress = "0xaA3B1fDC3Aa57Bf24418E397f8c80e7385aAa594"; // non-whitelisted address should be GHST holder
  const ghstHolderAddress = "0x3721546e51258065bfdb9746b2e442c7671b0298";
  const thirdParty = "0x382038b034fa8Ea64C74C81d680669bDaC4D0636";
  const originalPetOperator = "0x4E59235b35d504D1372ABf67a835031F98114d64"; // original pet operator should be MATIC holder
  const lockedPortalId = 0;
  const lockedAavegotchiId = 16911;
  const unlockedAavegotchiId = 15589;
  const initialCost = ethers.utils.parseUnits("1", "ether");
  const period = 10 * 86400; // 10 days
  const revenueSplitWithoutThirdParty: [
    BigNumberish,
    BigNumberish,
    BigNumberish
  ] = [50, 50, 0];
  const revenueSplitForThirdParty: [BigNumberish, BigNumberish, BigNumberish] =
    [25, 50, 25];
  let lendingFacetWithOwner: GotchiLendingFacet;
  let lendingFacetWithBorrower: GotchiLendingFacet;
  let lendingFacetWithClaimer: GotchiLendingFacet;
  let lendingFacetWithPortalOwner: GotchiLendingFacet;
  let whitelistFacetWithOwner: WhitelistFacet;
  let whitelistFacetWithPortalOwner: WhitelistFacet;
  let aavegotchiFacet: AavegotchiFacet;
  let erc721MarketplaceFacet: ERC721MarketplaceFacet;
  let aavegotchiGameFacet: AavegotchiGameFacet;
  let ghstERC20: ERC20Token;
  let aavegotchiOwnerAddress: any;
  let escrowAddress: any;
  let firstListingId: any;
  let secondListingId: any;
  let fourthListingId: any;
  let whitelistId: any;
  let secondWhitelistId: any;

  before(async function () {
    await upgrade();

    const gotchiLendingFacet = (await ethers.getContractAt(
      "GotchiLendingFacet",
      diamondAddress
    )) as GotchiLendingFacet;
    const whitelistFacet = (await ethers.getContractAt(
      "WhitelistFacet",
      diamondAddress
    )) as WhitelistFacet;
    aavegotchiFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      diamondAddress
    )) as AavegotchiFacet;
    erc721MarketplaceFacet = (await ethers.getContractAt(
      "ERC721MarketplaceFacet",
      diamondAddress
    )) as ERC721MarketplaceFacet;
    aavegotchiGameFacet = (await ethers.getContractAt(
      "AavegotchiGameFacet",
      diamondAddress
    )) as AavegotchiGameFacet;

    ghstERC20 = (await ethers.getContractAt(
      "ERC20Token",
      ghstAddress
    )) as ERC20Token;

    // This is needed for impersonating owner of test aavegotchi
    aavegotchiOwnerAddress = await aavegotchiFacet.ownerOf(lockedAavegotchiId);
    const portalOwnerAddress = await aavegotchiFacet.ownerOf(lockedPortalId);

    // set pet operator
    aavegotchiFacet = await impersonate(
      aavegotchiOwnerAddress,
      aavegotchiFacet,
      ethers,
      network
    );

    //@ts-ignore
    await aavegotchiFacet.setPetOperatorForAll(originalPetOperator, true);

    // set approval
    await (
      await aavegotchiFacet.setApprovalForAll(diamondAddress, true)
    ).wait();

    const aavegotchiFacetWithPortalOwner = await impersonate(
      portalOwnerAddress,
      aavegotchiFacet,
      ethers,
      network
    );
    await (
      await aavegotchiFacetWithPortalOwner.setApprovalForAll(
        diamondAddress,
        true
      )
    ).wait();

    // Impersonating facets for test
    lendingFacetWithOwner = await impersonate(
      aavegotchiOwnerAddress,
      gotchiLendingFacet,
      ethers,
      network
    );
    lendingFacetWithBorrower = await impersonate(
      borrowerAddress,
      gotchiLendingFacet,
      ethers,
      network
    );
    lendingFacetWithClaimer = await impersonate(
      claimerAddress,
      gotchiLendingFacet,
      ethers,
      network
    );
    lendingFacetWithPortalOwner = await impersonate(
      portalOwnerAddress,
      gotchiLendingFacet,
      ethers,
      network
    );
    whitelistFacetWithOwner = await impersonate(
      aavegotchiOwnerAddress,
      whitelistFacet,
      ethers,
      network
    );
    whitelistFacetWithPortalOwner = await impersonate(
      portalOwnerAddress,
      whitelistFacet,
      ethers,
      network
    );
    erc721MarketplaceFacet = await impersonate(
      portalOwnerAddress,
      erc721MarketplaceFacet,
      ethers,
      network
    );
    aavegotchiFacet = await impersonate(
      borrowerAddress,
      aavegotchiFacet,
      ethers,
      network
    );
    aavegotchiGameFacet = await impersonate(
      originalPetOperator,
      aavegotchiGameFacet,
      ethers,
      network
    );
    ghstERC20 = await impersonate(
      ghstHolderAddress,
      ghstERC20,
      ethers,
      network
    );
  });

  describe("Testing createWhitelist", async function () {
    it("Should revert if whitelist is empty", async function () {
      await expect(
        whitelistFacetWithOwner.createWhitelist("Empty", [])
      ).to.be.revertedWith(
        "WhitelistFacet: Whitelist length should be larger than zero"
      );
    });

    it("Should revert if whitelist name is empty", async function () {
      await expect(
        whitelistFacetWithOwner.createWhitelist("", [borrowerAddress])
      ).to.be.revertedWith("WhitelistFacet: Whitelist name cannot be blank");
    });
    // it("Should revert if whitelist length exceeds limit", async function () {
    //   const whitelistLargerThanLimit = Array(101).fill(borrowerAddress);
    //   await expect(whitelistFacetWithOwner.createWhitelist('', whitelistLargerThanLimit)).to.be.revertedWith("WhitelistFacet: Whitelist length exceeds limit");
    // });
    // it("Should revert if whitelist contains address-zero", async function () {
    //   await expect(whitelistFacetWithOwner.createWhitelist([borrowerAddress, ethers.constants.AddressZero])).to.be.revertedWith("WhitelistFacet: There's invalid address in the list");
    // });
    it("Should succeed if whitelist is valid", async function () {
      const whitelistsLength =
        await whitelistFacetWithOwner.getWhitelistsLength();
      const receipt = await (
        await whitelistFacetWithOwner.createWhitelist("Empty", [
          borrowerAddress,
        ])
      ).wait();
      const event = receipt!.events!.find(
        (event) => event.event === "WhitelistCreated"
      );
      whitelistId = event!.args!.whitelistId;
      expect(whitelistId).to.equal(whitelistsLength.add(1));
    });
  });

  describe("Testing updateWhitelist", async function () {
    it("Should revert if invalid whitelist id", async function () {
      await expect(
        whitelistFacetWithOwner.updateWhitelist(whitelistId + 1, [
          nonWhitelistedAddress,
        ])
      ).to.be.revertedWith("WhitelistFacet: Whitelist not found");
    });
    it("Should revert if not whitelist owner", async function () {
      const receipt = await (
        await whitelistFacetWithPortalOwner.createWhitelist("Empty", [
          nonWhitelistedAddress,
        ])
      ).wait();
      const event = receipt!.events!.find(
        (event) => event.event === "WhitelistCreated"
      );
      secondWhitelistId = event!.args!.whitelistId;
      await expect(
        whitelistFacetWithOwner.updateWhitelist(secondWhitelistId, [
          nonWhitelistedAddress,
        ])
      ).to.be.revertedWith("WhitelistFacet: Not whitelist owner");
    });
    it("Should revert if whitelist is empty", async function () {
      await expect(
        whitelistFacetWithOwner.updateWhitelist(whitelistId, [])
      ).to.be.revertedWith(
        "WhitelistFacet: Whitelist length should be larger than zero"
      );
    });
    // it("Should revert if whitelist length exceeds limit", async function () {
    //   const whitelistLargerThanLimit = Array(100).fill(borrowerAddress);
    //   await expect(whitelistFacetWithOwner.updateWhitelist(whitelistId, whitelistLargerThanLimit)).to.be.revertedWith("WhitelistFacet: Whitelist length exceeds limit");
    // });
    // it("Should revert if whitelist contains address-zero", async function () {
    //   await expect(whitelistFacetWithOwner.updateWhitelist(whitelistId, [nonGhstHolderAddress, ethers.constants.AddressZero])).to.be.revertedWith("WhitelistFacet: There's invalid address in the list");
    // });
    it("Should succeed if all parameters are valid", async function () {
      const receipt = await (
        await whitelistFacetWithOwner.updateWhitelist(whitelistId, [
          nonGhstHolderAddress,
          borrowerAddress,
        ])
      ).wait();
      const event = receipt!.events!.find(
        (event) => event.event === "WhitelistUpdated"
      );
      expect(event!.args!.whitelistId).to.equal(whitelistId);
    });
  });

  describe("Testing getWhitelist", async function () {
    it("Should revert if invalid whitelist id", async function () {
      await expect(
        whitelistFacetWithOwner.getWhitelist(secondWhitelistId + 1)
      ).to.be.revertedWith("WhitelistFacet: Whitelist not found");
    });
    it("Should return array if valid whitelist id", async function () {
      const whitelist = await whitelistFacetWithOwner.getWhitelist(whitelistId);
      expect(whitelist.owner).to.equal(aavegotchiOwnerAddress);
      expect(whitelist.addresses.length).to.equal(2);
      expect(whitelist.addresses[0]).to.equal(borrowerAddress);
    });
  });

  describe("Testing remove from whitelist", async () => {
    it("Should remove elements from whitelist", async () => {
      let addresses: string[] = [];
      for (let i = 0; i < 10; i++) {
        addresses.push(
          ethers.utils.computeAddress(
            ethers.utils.keccak256(ethers.utils.hexlify(i))
          )
        );
      }
      await whitelistFacetWithOwner.createWhitelist("OMEGALUL", addresses);
      let whitelistsLength =
        await whitelistFacetWithOwner.getWhitelistsLength();
      let whitelist = await whitelistFacetWithOwner.getWhitelist(
        whitelistsLength
      );
      expect(whitelist.addresses.length).to.equal(10);

      await whitelistFacetWithOwner.removeAddressesFromWhitelist(
        whitelistsLength,
        [addresses[0], addresses[5], addresses[9]]
      );

      whitelist = await whitelistFacetWithOwner.getWhitelist(whitelistsLength);
      expect(whitelist.addresses.length).to.equal(7);

      for (let i = 1; i < 9; i++) {
        expect(whitelist.addresses).to.include(addresses[i]);
        expect(
          await whitelistFacetWithOwner.isWhitelisted(
            whitelistsLength,
            addresses[i]
          )
        ).to.be.gt(0);
        if (i == 4) i++;
      }
      expect(
        await whitelistFacetWithOwner.isWhitelisted(
          whitelistsLength,
          addresses[0]
        )
      ).to.be.eq(0);
      expect(
        await whitelistFacetWithOwner.isWhitelisted(
          whitelistsLength,
          addresses[5]
        )
      ).to.be.eq(0);
      expect(
        await whitelistFacetWithOwner.isWhitelisted(
          whitelistsLength,
          addresses[9]
        )
      ).to.be.eq(0);

      // REMOVE THEM ALLLLLL
      await whitelistFacetWithOwner.removeAddressesFromWhitelist(
        whitelistsLength,
        addresses
      );
      whitelist = await whitelistFacetWithOwner.getWhitelist(whitelistsLength);
      expect(whitelist.addresses.length).to.equal(0);
      for (let i = 0; i < 10; i++) {
        expect(
          await whitelistFacetWithOwner.isWhitelisted(
            whitelistsLength,
            addresses[i]
          )
        ).to.be.eq(0);
      }
    });
  });
});
