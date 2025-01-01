/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
import { upgrade } from "../scripts/upgrades/upgrade-itemsFacet";
import { impersonate, resetChain } from "../scripts/helperFunctions";
import {
  AavegotchiFacet,
  WearablesFacet,
  ItemsFacet,
  ItemsRolesRegistryFacet,
} from "../typechain";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import {
  buildCommitment,
  buildGrantRole,
} from "./ItemsRolesRegistryFacet/helpers";

const { expect } = chai;

describe("Testing Batch Equip Wearables", async function () {
  this.timeout(300000);

  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  const wearablesDiamondAddress = "0x58de9AaBCaeEC0f69883C94318810ad79Cc6a44f";
  const wearables = [0, 0, 0, 221, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const otherWearables = [0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const wearablesWithInvalidId = [
    418, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ];
  const wearablesWithInvalidSlot = [
    104, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ];
  const wearablesWithRentals = [
    0, 0, 0, 221, 205, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ];
  const emptyWearables = new Array(16).fill(0);
  const aavegotchiId = 15434;
  const anotherOwnerAavegotchiId = 10356;
  const anotherWearablesOwner = "0xE1bCD0f5c6c855ee3452B38E16FeD0b7Cb0CC507";
  const nullAddress = ethers.constants.AddressZero;

  let aavegotchiOwnerAddress: any;
  let anotherAavegotchiOwnerAddress: any;
  let gotchisOfOwner: number[];
  let depositIdsOfWearableRentals: number[];
  let aavegotchiFacet: AavegotchiFacet;
  let wearablesFacet: WearablesFacet;
  let itemsRolesRegistryFacet: ItemsRolesRegistryFacet;
  let aavegotchiFacetWithOwner: AavegotchiFacet;
  let itemsFacetWithOwner: ItemsFacet;
  let wearablesFacetWithOwner: WearablesFacet;
  let itemsFacetWithOtherOwner: ItemsFacet;
  let itemsRolesRegistryFacetWithOwner: Contract;

  before(async function () {
    //await resetChain(hre);

    // workaround for issue https://github.com/NomicFoundation/hardhat/issues/5511
    //await helpers.mine()

    await upgrade();

    aavegotchiFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      diamondAddress,
    )) as AavegotchiFacet;

    wearablesFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/WearableDiamond/facets/WearablesFacet.sol:WearablesFacet",
      wearablesDiamondAddress,
    )) as WearablesFacet;

    itemsRolesRegistryFacet = await ethers.getContractAt(
      "ItemsRolesRegistryFacet",
      diamondAddress,
    );

    let itemsFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      diamondAddress,
    )) as ItemsFacet;

    // get owners of gotchis
    aavegotchiOwnerAddress = await aavegotchiFacet.ownerOf(aavegotchiId);
    anotherAavegotchiOwnerAddress = await aavegotchiFacet.ownerOf(
      anotherOwnerAavegotchiId,
    );

    // impersonate signers
    let aavegotchiFacetWithOtherSigner: AavegotchiFacet = await impersonate(
      anotherAavegotchiOwnerAddress,
      aavegotchiFacet,
      ethers,
      network,
    );
    let wearablesFacetWithOtherSigner: WearablesFacet = await impersonate(
      anotherWearablesOwner,
      wearablesFacet,
      ethers,
      network,
    );
    wearablesFacetWithOwner = await impersonate(
      aavegotchiOwnerAddress,
      wearablesFacet,
      ethers,
      network,
    );
    itemsFacetWithOwner = await impersonate(
      aavegotchiOwnerAddress,
      itemsFacet,
      ethers,
      network,
    );
    itemsFacetWithOtherOwner = await impersonate(
      anotherAavegotchiOwnerAddress,
      itemsFacet,
      ethers,
      network,
    );
    aavegotchiFacetWithOwner = await impersonate(
      aavegotchiOwnerAddress,
      aavegotchiFacet,
      ethers,
      network,
    );
    itemsRolesRegistryFacetWithOwner = await impersonate(
      aavegotchiOwnerAddress,
      itemsRolesRegistryFacet,
      ethers,
      network,
    );

    // transfer gotchi and wearable for tests
    await aavegotchiFacetWithOtherSigner.transferFrom(
      anotherAavegotchiOwnerAddress,
      aavegotchiOwnerAddress,
      anotherOwnerAavegotchiId,
    );
    await wearablesFacetWithOtherSigner.safeTransferFrom(
      anotherWearablesOwner,
      aavegotchiOwnerAddress,
      3,
      1,
      "0x",
    );

    // get gotchis of owner
    gotchisOfOwner = await aavegotchiFacet.tokenIdsOfOwner(
      aavegotchiOwnerAddress,
    );

    // equip transfered wearable on transeferd gotchi
    await itemsFacetWithOwner.equipWearables(gotchisOfOwner[2], otherWearables);
  });

  describe("Testing batch functions to equip wearables", async function () {
    async function getWearables(_tokenId: number): number[] {
      const currentWearables =
        await itemsFacetWithOwner.equippedWearables(_tokenId);
      return currentWearables;
    }

    it("Should unequip all wearables from multiple gotchis", async function () {
      await itemsFacetWithOwner.batchEquipWearables(
        [gotchisOfOwner[2], gotchisOfOwner[3]],
        [emptyWearables, emptyWearables],
      );
      expect(await getWearables(gotchisOfOwner[2])).to.deep.equal(
        emptyWearables,
      );
      expect(await getWearables(gotchisOfOwner[3])).to.deep.equal(
        emptyWearables,
      );

      // reset for next test
      await itemsFacetWithOwner.equipWearables(gotchisOfOwner[2], wearables);
      await itemsFacetWithOwner.equipWearables(
        gotchisOfOwner[3],
        otherWearables,
      );
    });
    it("Should be able to unequip and requip the same gotchi", async function () {
      await itemsFacetWithOwner.batchEquipWearables(
        [gotchisOfOwner[2], gotchisOfOwner[2]],
        [emptyWearables, wearables],
      );
      expect(await getWearables(gotchisOfOwner[2])).to.deep.equal(wearables);
    });
    it("Should be able to unequip from one gotchi to equip on the next", async function () {
      await itemsFacetWithOwner.batchEquipWearables(
        [gotchisOfOwner[2], gotchisOfOwner[3]],
        [emptyWearables, wearables],
      );
      expect(await getWearables(gotchisOfOwner[2])).to.deep.equal(
        emptyWearables,
      );
      expect(await getWearables(gotchisOfOwner[3])).to.deep.equal(wearables);

      // reequip for next test (inversed)
      await itemsFacetWithOwner.equipWearables(
        gotchisOfOwner[2],
        otherWearables,
      );
    });
    it("Should be able to completely flip wearables between two gotchis", async function () {
      const firstGotchiId = gotchisOfOwner[2];
      const secondGotchiId = gotchisOfOwner[3];
      const firstGotchiWearables = await getWearables(firstGotchiId);
      const secondGotchiWearables = await getWearables(secondGotchiId);
      await itemsFacetWithOwner.batchEquipWearables(
        [firstGotchiId, secondGotchiId, firstGotchiId, secondGotchiId],
        [
          emptyWearables,
          emptyWearables,
          secondGotchiWearables,
          firstGotchiWearables,
        ],
      );
      expect(await getWearables(firstGotchiId)).to.deep.equal(
        secondGotchiWearables,
      );
      expect(await getWearables(secondGotchiId)).to.deep.equal(
        firstGotchiWearables,
      );

      // unequip to free wearables for next test
      await itemsFacetWithOwner.equipWearables(
        gotchisOfOwner[2],
        emptyWearables,
      );

      // retransfer to other owner for next test
      await aavegotchiFacetWithOwner.transferFrom(
        aavegotchiOwnerAddress,
        anotherAavegotchiOwnerAddress,
        anotherOwnerAavegotchiId,
      );
    });
    it("Should unequip and requip wearables with rentals ", async function () {
      let CommitmentCreated: Commitment;
      let GrantRoleData: GrantRoleData;
      let depositIdsCounter = 0;

      // rent a wearable
      CommitmentCreated = buildCommitment({
        grantor: aavegotchiOwnerAddress,
        tokenAddress: wearablesDiamondAddress,
        tokenId: 205,
      });

      depositIdsCounter = Number(
        (
          await itemsRolesRegistryFacet
            .connect(aavegotchiOwnerAddress)
            .callStatic.commitTokens(
              CommitmentCreated.grantor,
              CommitmentCreated.tokenAddress,
              CommitmentCreated.tokenId,
              CommitmentCreated.tokenAmount,
            )
        ).toString(),
      );

      GrantRoleData = await buildGrantRole({
        depositId: depositIdsCounter,
        grantee: anotherAavegotchiOwnerAddress,
      });

      await wearablesFacetWithOwner.setApprovalForAll(
        itemsRolesRegistryFacet.address,
        true,
      );

      await itemsRolesRegistryFacetWithOwner.commitTokens(
        CommitmentCreated.grantor,
        CommitmentCreated.tokenAddress,
        CommitmentCreated.tokenId,
        CommitmentCreated.tokenAmount,
      );
      await itemsRolesRegistryFacetWithOwner.grantRole(
        GrantRoleData.depositId,
        GrantRoleData.role,
        GrantRoleData.grantee,
        GrantRoleData.expirationDate,
        GrantRoleData.revocable,
        GrantRoleData.data,
      );

      depositIdsOfWearableRentals = [
        0, 0, 0, 0, depositIdsCounter, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ];

      // unequip and reequip with rental
      await itemsFacetWithOtherOwner.batchEquipDelegatedWearables(
        [anotherOwnerAavegotchiId, anotherOwnerAavegotchiId],
        [emptyWearables, wearablesWithRentals],
        [emptyWearables, depositIdsOfWearableRentals],
      );
      expect(await getWearables(anotherOwnerAavegotchiId)).to.deep.equal(
        wearablesWithRentals,
      );
    });
    it("Should revert if arguments are not all the same length ", async function () {
      await expect(
        itemsFacetWithOwner.batchEquipWearables(
          [gotchisOfOwner[2], gotchisOfOwner[3]],
          [emptyWearables],
        ),
      ).to.be.revertedWith(
        "ItemsFacet: _wearablesToEquip length not same as _tokenIds length",
      );
      await expect(
        itemsFacetWithOtherOwner.batchEquipDelegatedWearables(
          [anotherOwnerAavegotchiId, anotherOwnerAavegotchiId],
          [emptyWearables],
          [emptyWearables, emptyWearables],
        ),
      ).to.be.revertedWith(
        "ItemsFacet: _wearablesToEquip length not same as _tokenIds length",
      );
      await expect(
        itemsFacetWithOtherOwner.batchEquipDelegatedWearables(
          [aavegotchiId, aavegotchiId],
          [emptyWearables, emptyWearables],
          [emptyWearables],
        ),
      ).to.be.revertedWith(
        "ItemsFacet: _depositIds length not same as _tokenIds length",
      );
    });
  });
});
