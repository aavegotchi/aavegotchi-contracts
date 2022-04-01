/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
import { upgrade } from "../scripts/upgrades/upgrade-gotchiLendingOptimize";
import { impersonate } from "../scripts/helperFunctions";
import {
  AavegotchiFacet,
  AavegotchiGameFacet,
  GotchiLendingFacet,
  WhitelistFacet,
} from "../typechain";
import { BigNumberish } from "ethers";

const { expect } = chai;

describe("Testing Aavegotchi Lending", async function () {
  this.timeout(300000);



  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  const borrowerAddress = "0xb4473cfEeDC9a0E94612c6ce883677b63f830DB8"; // borrower should be GHST holder
  const thirdParty = "0x382038b034fa8Ea64C74C81d680669bDaC4D0636";
  const originalPetOperator = "0x4E59235b35d504D1372ABf67a835031F98114d64"; // original pet operator should be MATIC holder
  const gotchiHolder = "0x8FEebfA4aC7AF314d90a0c17C3F91C800cFdE44B";
  const linkiest = "0xaCC227235cCAb6C058B76600D4EC2e86072d0813";
  const lockedAavegotchiId = 16911;
  let lendingFacetWithBorrower: GotchiLendingFacet;
  let lendingFacetWithGotchiOwner: GotchiLendingFacet;
  let lendingFacetWithSirLinkiest: GotchiLendingFacet;
  let whitelistFacetWithOwner: WhitelistFacet;
  let aavegotchiFacet: AavegotchiFacet;
  let aavegotchiGameFacet: AavegotchiGameFacet;
  let aavegotchiOwnerAddress: any;
  let whitelistId: any;

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
    aavegotchiGameFacet = (await ethers.getContractAt(
      "AavegotchiGameFacet",
      diamondAddress
    )) as AavegotchiGameFacet;

    aavegotchiOwnerAddress = await aavegotchiFacet.ownerOf(lockedAavegotchiId);

    lendingFacetWithBorrower = await impersonate(
      borrowerAddress,
      gotchiLendingFacet,
      ethers,
      network
    );
    lendingFacetWithGotchiOwner = await impersonate(
      gotchiHolder,
      gotchiLendingFacet,
      ethers,
      network
    )
    lendingFacetWithSirLinkiest = await impersonate(
      linkiest,
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

  });

  describe("Testing lending and whitelist", async () => {
    it("Should be able to transfer ownership of a whitelist", async() => {
      await whitelistFacetWithOwner.createWhitelist("yore mum", [thirdParty]);
      whitelistId = await whitelistFacetWithOwner.getWhitelistsLength();
      await whitelistFacetWithOwner.transferOwnershipOfWhitelist(whitelistId, ethers.constants.AddressZero);
      expect(await whitelistFacetWithOwner.whitelistOwner(whitelistId)).to.equal(ethers.constants.AddressZero);
    });
    it("Should not be able to transfer ownership of a whitelist if not the owner", async() => {
      await expect(
        whitelistFacetWithOwner.transferOwnershipOfWhitelist(
          1, ethers.constants.AddressZero
        )
      ).to.be.revertedWith("WhitelistFacet: Not whitelist owner");
    });
    it("Shouldn't be able to list with a period of more than 30 days", async() => {
      await expect(lendingFacetWithGotchiOwner.addGotchiLending(
        11939,
        0,
        2_600_000,
        [50, 50, 0],
        gotchiHolder,
        ethers.constants.AddressZero,
        0,
        [],
      )).to.be.revertedWith("GotchiLending: Period too long");
      
    });
    it("Should only allow one borrowed gotchi", async() => {
      // Create two listings
      await lendingFacetWithGotchiOwner.addGotchiLending(
        11939,
        0,
        2591000,
        [50, 50, 0],
        gotchiHolder,
        ethers.constants.AddressZero,
        0,
        [],
      );      
      await lendingFacetWithGotchiOwner.addGotchiLending(
        22003,
        0,
        2591000,
        [50, 50, 0],
        gotchiHolder,
        ethers.constants.AddressZero,
        0,
        [],
      );
      // Borrow first listing
      let lendingIds: [BigNumberish, BigNumberish] = [
        await lendingFacetWithGotchiOwner.getGotchiLendingIdByToken(11939),
        await lendingFacetWithGotchiOwner.getGotchiLendingIdByToken(22003)
      ];
      await lendingFacetWithBorrower.agreeGotchiLending(
        lendingIds[0],
        11939,
        0,
        2591000,
        [50, 50, 0],
      );
      // Borrow second listing should fail
      await expect(
        lendingFacetWithBorrower.agreeGotchiLending(
          lendingIds[1],
          22003,
          0,
          2591000,
          [50, 50, 0],
        )
      ).to.be.revertedWith("GotchiLending: Already borrowing");

    });
    it("Lender cannot end the term early", async() => {
      await expect(lendingFacetWithGotchiOwner.claimAndEndGotchiLending(
        11939
      )).to.be.revertedWith("GotchiLending: Not allowed during agreement");
    });
    it("Borrower should be able to end lending early", async() => {
      await lendingFacetWithBorrower.claimAndEndGotchiLending(
        11939
      );
      expect(await lendingFacetWithBorrower.isAavegotchiLent(22003)).to.be.false;
    });
    it("Lender should be able to end a long existing borrow early", async() => {
      await network.provider.send("evm_increaseTime", [2592000]);
      await network.provider.send("evm_mine");
      await lendingFacetWithSirLinkiest.claimAndEndGotchiLending(
        13835
      );
      expect(await lendingFacetWithSirLinkiest.isAavegotchiLent(13835)).to.be.false;
    });
  });
});
