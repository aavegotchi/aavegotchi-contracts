/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
import {
  AavegotchiFacet,
  DAOFacet,
  ItemsFacet,
  LibERC1155,
  LibEventHandler,
  WearablesFacet,
} from "../../typechain";

import { BigNumber, Contract, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  LargeGotchiOwner,
  LargeGotchiOwnerAavegotchis,
  aavegotchiDiamondAddress,
  wearableAmounts,
  wearableDiamondAddress,
  wearableIds,
  RoleAssignment,
  buildRoleAssignment,
  generateRandomInt,
  ONE_DAY,
  ItemDepositId,
} from "./helpers";
import { itemManagerAlt } from "../../scripts/helperFunctions";
import { upgradeWithNewFacets } from "./upgradeScript";

const { expect } = chai;

const AddressZero = ethers.constants.AddressZero;

describe("ItemsRolesRegistryFacet", async () => {
  let ItemsRolesRegistryFacet: Contract;
  let grantor: SignerWithAddress;
  let grantee: Signer;
  let anotherUser: SignerWithAddress;
  let wearablesFacet: WearablesFacet;
  let libEventHandler: LibEventHandler;
  let itemsFacet: ItemsFacet;
  let daoFacet: DAOFacet;
  let aavegotchiFacet: AavegotchiFacet;
  let libERC1155: LibERC1155;

  const gotchiId = LargeGotchiOwnerAavegotchis[0];
  const emptyItemDepositIds: ItemDepositId[] = new Array(16).fill({
    nonce: BigNumber.from(0),
    grantor: AddressZero,
  });
  const emptyWearableIds: number[] = new Array(16).fill(BigNumber.from(0));

  before(async () => {
    const signers = await ethers.getSigners();
    grantor = signers[0];
    anotherUser = signers[2];

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [LargeGotchiOwner],
    });
    grantee = await ethers.provider.getSigner(LargeGotchiOwner);

    const diamondOwnerAddress = "0x01F010a5e001fe9d6940758EA5e8c777885E351e";
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [diamondOwnerAddress],
    });
    const diamondOwner = await ethers.provider.getSigner(diamondOwnerAddress);

    await upgradeWithNewFacets({
      diamondAddress: aavegotchiDiamondAddress,
      facetNames: [
        "ItemsRolesRegistryFacet",
        "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
        "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet"
      ],
      signer: diamondOwner,
    });

    ItemsRolesRegistryFacet = await ethers.getContractAt(
      "ItemsRolesRegistryFacet",
      aavegotchiDiamondAddress
    );

    wearablesFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/WearableDiamond/facets/WearablesFacet.sol:WearablesFacet",
      wearableDiamondAddress
    )) as WearablesFacet;

    libEventHandler = (await ethers.getContractAt(
      "contracts/Aavegotchi/WearableDiamond/libraries/LibEventHandler.sol:LibEventHandler",
      wearableDiamondAddress
    )) as LibEventHandler;

    itemsFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      aavegotchiDiamondAddress
    )) as ItemsFacet;

    libERC1155 = (await ethers.getContractAt(
      "contracts/shared/libraries/LibERC1155.sol:LibERC1155",
      aavegotchiDiamondAddress
    )) as LibERC1155;

    aavegotchiFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      aavegotchiDiamondAddress
    )) as AavegotchiFacet;

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManagerAlt],
    });
    const signer = await ethers.provider.getSigner(itemManagerAlt);

    daoFacet = await ethers.getContractAt(
      "DAOFacet",
      aavegotchiDiamondAddress,
      signer
    );

    await daoFacet.updateItemTypeMaxQuantity(wearableIds, wearableIds.map(() => 2000));
    await daoFacet.mintItems(
      grantor.address,
      wearableIds,
      wearableIds.map(() => 1000)
    );
  });

  describe("equipDelegatedWearables", () => {
    let RoleAssignment: RoleAssignment;

    beforeEach(async () => {
      RoleAssignment = await buildRoleAssignment({
        tokenAddress: wearablesFacet.address,
        tokenId: wearableIds[3],
        grantor: grantor.address,
        grantee: LargeGotchiOwner,
      });
      await wearablesFacet
        .connect(grantor)
        .setApprovalForAll(ItemsRolesRegistryFacet.address, true);

      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(RoleAssignment)
      ).to.not.be.reverted;
    });

    it("should equip and unequip delegated wearable", async () => {
      const itemDepositIds: ItemDepositId[] = new Array(16).fill({
        nonce: BigNumber.from(0),
        grantor: AddressZero,
      });
      itemDepositIds[3] = {
        nonce: RoleAssignment.nonce,
        grantor: RoleAssignment.grantor,
      };

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            [0, 0, 0, wearableIds[3], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            itemDepositIds
          )
      )
        .to.emit(libERC1155, "TransferToParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[3], 1)
        .to.not.emit(libEventHandler, "TransferSingle");

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            emptyWearableIds,
            emptyItemDepositIds
          )
      )
        .to.emit(libERC1155, "TransferFromParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[3], 1)
        .to.not.emit(libEventHandler, "TransferSingle");
    });
    it("should unequip a delegated wearable when the role is revoked", async () => {
      const itemDepositIds: ItemDepositId[] = new Array(16).fill({
        nonce: BigNumber.from(0),
        grantor: AddressZero,
      });
      itemDepositIds[3] = {
        nonce: RoleAssignment.nonce,
        grantor: RoleAssignment.grantor,
      };
      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            [0, 0, 0, wearableIds[3], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            itemDepositIds
          )
      )
        .to.emit(libERC1155, "TransferToParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[3], 1)
        .to.not.emit(libEventHandler, "TransferSingle");

      await expect(
        ItemsRolesRegistryFacet.connect(grantor).revokeRoleFrom(
          RoleAssignment.role,
          RoleAssignment.nonce,
          RoleAssignment.grantor,
          RoleAssignment.grantee
        )
      )
        .to.emit(libERC1155, "TransferFromParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[3], 1)
        .to.not.emit(libEventHandler, "TransferSingle");
    });
    it("should equip and unequip delegated hand wearables", async () => {
      const newRoleAssignment = await buildRoleAssignment({
        tokenAddress: wearablesFacet.address,
        tokenId: wearableIds[0],
        grantor: grantor.address,
        grantee: LargeGotchiOwner,
        tokenAmount: 2,
      });

      // wearables[0] -> hands
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(
          newRoleAssignment
        )
      ).to.not.be.reverted;

      const itemDepositIds: ItemDepositId[] = new Array(16).fill({
        nonce: BigNumber.from(0),
        grantor: AddressZero,
      });
      itemDepositIds[4] = {
        nonce: newRoleAssignment.nonce,
        grantor: newRoleAssignment.grantor,
      };
      itemDepositIds[5] = {
        nonce: newRoleAssignment.nonce,
        grantor: newRoleAssignment.grantor,
      };

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            [
              0,
              0,
              0,
              0,
              wearableIds[0],
              wearableIds[0],
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
            ],
            itemDepositIds
          )
      )
        .to.emit(libERC1155, "TransferToParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[0], 2)
        .to.not.emit(libEventHandler, "TransferSingle");

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            emptyWearableIds,
            emptyItemDepositIds
          )
      )
        .to.emit(libERC1155, "TransferFromParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[0], 1)
        .to.emit(libERC1155, "TransferFromParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[0], 1)
        .to.not.emit(libEventHandler, "TransferSingle");
    });
    it("should equip and unequip mixed delegated and not delegated wearables", async () => {
      await wearablesFacet
        .connect(grantor)
        .safeTransferFrom(
          grantor.address,
          LargeGotchiOwner,
          wearableIds[0],
          2,
          "0x"
        );
      // wearables[0] -> hands
      // wearables[1] -> hat
      const itemDepositIds: ItemDepositId[] = new Array(16).fill({
        nonce: BigNumber.from(0),
        grantor: AddressZero,
      });
      itemDepositIds[3] = {
        nonce: RoleAssignment.nonce,
        grantor: RoleAssignment.grantor,
      };

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            [
              0,
              0,
              0,
              wearableIds[3],
              wearableIds[0],
              wearableIds[0],
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
            ],
            itemDepositIds
          )
      )
        .to.emit(libERC1155, "TransferToParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[3], 1)
        .to.emit(libEventHandler, "TransferSingle")
        .withArgs(
          LargeGotchiOwner,
          LargeGotchiOwner,
          aavegotchiDiamondAddress,
          wearableIds[0],
          2
        );

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            emptyWearableIds,
            emptyItemDepositIds
          )
      )
        .to.emit(libERC1155, "TransferFromParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[3], 1)
        .to.emit(libEventHandler, "TransferSingle")
        .withArgs(
          LargeGotchiOwner,
          aavegotchiDiamondAddress,
          LargeGotchiOwner,
          wearableIds[0],
          1
        )
        .to.emit(libEventHandler, "TransferSingle")
        .withArgs(
          LargeGotchiOwner,
          aavegotchiDiamondAddress,
          LargeGotchiOwner,
          wearableIds[0],
          1
        );
    });
    it("should equip delegated wearables in two gotchis with the same depositId and unequip all with revoke", async () => {
      RoleAssignment = await buildRoleAssignment({
        tokenAddress: wearablesFacet.address,
        tokenId: wearableIds[1],
        tokenAmount: 2,
        grantor: grantor.address,
        grantee: LargeGotchiOwner,
      });

      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(RoleAssignment)
      ).to.not.be.reverted;

      const itemDepositIds: ItemDepositId[] = new Array(16).fill({
        nonce: BigNumber.from(0),
        grantor: AddressZero,
      });
      itemDepositIds[2] = {
        nonce: RoleAssignment.nonce,
        grantor: RoleAssignment.grantor,
      };

      const anotherGotchiId = LargeGotchiOwnerAavegotchis[1];
      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            [0, 0, wearableIds[1], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            itemDepositIds
          )
      )
        .to.emit(libERC1155, "TransferToParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[1], 1)
        .to.not.emit(libEventHandler, "TransferSingle");

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            anotherGotchiId,
            [0, 0, wearableIds[1], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            itemDepositIds
          )
      )
        .to.emit(libERC1155, "TransferToParent")
        .withArgs(aavegotchiDiamondAddress, anotherGotchiId, wearableIds[1], 1)
        .to.not.emit(libEventHandler, "TransferSingle");

      const anotherGotchiId2 = LargeGotchiOwnerAavegotchis[2];
      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            anotherGotchiId2,
            [0, 0, wearableIds[1], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            itemDepositIds
          )
      ).to.be.revertedWith("ItemsFacet: Not enough delegated balance");

      await expect(
        ItemsRolesRegistryFacet.connect(grantor).revokeRoleFrom(
          RoleAssignment.role,
          RoleAssignment.nonce,
          RoleAssignment.grantor,
          RoleAssignment.grantee
        )
      )
        .to.emit(libERC1155, "TransferFromParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[1], 1)
        .to.emit(libERC1155, "TransferFromParent")
        .withArgs(aavegotchiDiamondAddress, anotherGotchiId, wearableIds[1], 1)
        .to.not.emit(libEventHandler, "TransferSingle");
    });
    it("should NOT equip a delegated wearable if the depositId is from another wearable", async () => {
      const roleAssignment = await buildRoleAssignment({
        tokenAddress: wearablesFacet.address,
        tokenId: wearableIds[2],
        grantor: grantor.address,
        grantee: await grantee.getAddress(),
      });
      await wearablesFacet
        .connect(grantor)
        .setApprovalForAll(ItemsRolesRegistryFacet.address, true);

      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(roleAssignment)
      ).to.not.be.reverted;

      const wrongNonce = RoleAssignment.nonce;
      const itemDepositIds: ItemDepositId[] = new Array(16).fill({
        nonce: BigNumber.from(0),
        grantor: AddressZero,
      });
      itemDepositIds[3] = {
        nonce: wrongNonce,
        grantor: RoleAssignment.grantor,
      };

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            [0, 0, 0, wearableIds[2], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            itemDepositIds
          )
      ).to.be.revertedWith(
        "ItemsFacet: Delegated Wearable not of this delegation"
      );
    });
    it("should NOT equip a delegated wearable if the grantee is invalid for respective depositId", async () => {
      const roleAssignment = await buildRoleAssignment({
        tokenAddress: wearablesFacet.address,
        tokenId: wearableIds[2],
        grantor: grantor.address,
        grantee: anotherUser.address,
      });
      await wearablesFacet
        .connect(grantor)
        .setApprovalForAll(ItemsRolesRegistryFacet.address, true);

      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(roleAssignment)
      ).to.not.be.reverted;
      const itemDepositIds: ItemDepositId[] = new Array(16).fill({
        nonce: BigNumber.from(0),
        grantor: AddressZero,
      });
      itemDepositIds[3] = {
        nonce: roleAssignment.nonce,
        grantor: roleAssignment.grantor,
      };

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            [0, 0, 0, wearableIds[2], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            itemDepositIds
          )
      ).to.be.revertedWith(
        "ItemsFacet: Wearable not delegated to sender or depositId not valid"
      );
    });
    it("should NOT equip a delegated wearable if the depositId does not exist", async () => {
      const roleAssignment = await buildRoleAssignment({
        tokenAddress: wearablesFacet.address,
        tokenId: wearableIds[2],
        grantor: grantor.address,
        grantee: await grantee.getAddress(),
      });
      await wearablesFacet
        .connect(grantor)
        .setApprovalForAll(ItemsRolesRegistryFacet.address, true);

      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(roleAssignment)
      ).to.not.be.reverted;

      const wrongNonce = generateRandomInt();
      const itemDepositIds: ItemDepositId[] = new Array(16).fill({
        nonce: BigNumber.from(0),
        grantor: AddressZero,
      });
      itemDepositIds[3] = {
        nonce: wrongNonce,
        grantor: roleAssignment.grantor,
      };

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            [0, 0, 0, wearableIds[2], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            itemDepositIds
          )
      ).to.be.revertedWith(
        "ItemsFacet: Wearable not delegated to sender or depositId not valid"
      );
    });
    it("should NOT equip a delegated wearable if the wearable is all delegated balance is already equipped in other gotchi", async () => {
      const itemDepositIds: ItemDepositId[] = new Array(16).fill({
        nonce: BigNumber.from(0),
        grantor: AddressZero,
      });
      itemDepositIds[3] = {
        nonce: RoleAssignment.nonce,
        grantor: RoleAssignment.grantor,
      };

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            [0, 0, 0, wearableIds[3], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            itemDepositIds
          )
      )
        .to.emit(libERC1155, "TransferToParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[3], 1)
        .to.not.emit(libEventHandler, "TransferSingle");

      const anotherGotchiId = LargeGotchiOwnerAavegotchis[1];
      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            anotherGotchiId,
            [0, 0, 0, wearableIds[3], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            itemDepositIds
          )
      ).to.be.revertedWith("ItemsFacet: Not enough delegated balance");

      // unequip for next test
      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            emptyWearableIds,
            emptyItemDepositIds
          )
      )
        .to.emit(libERC1155, "TransferFromParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[3], 1)
        .to.not.emit(libEventHandler, "TransferSingle");
    });
    it("should NOT equip a delegated wearable if sender doesn't enough delegated balance", async function () {
      const newRoleAssignment = await buildRoleAssignment({
        tokenAddress: wearablesFacet.address,
        tokenId: wearableIds[0],
        grantor: grantor.address,
        grantee: await grantee.getAddress(),
        tokenAmount: 1,
      });
      await wearablesFacet
        .connect(grantor)
        .setApprovalForAll(ItemsRolesRegistryFacet.address, true);

      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(
          newRoleAssignment
        )
      ).to.not.be.reverted;
      const itemDepositIds: ItemDepositId[] = new Array(16).fill({
        nonce: BigNumber.from(0),
        grantor: AddressZero,
      });
      itemDepositIds[4] = {
        nonce: newRoleAssignment.nonce,
        grantor: newRoleAssignment.grantor,
      };
      itemDepositIds[5] = {
        nonce: newRoleAssignment.nonce,
        grantor: newRoleAssignment.grantor,
      };

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            [
              0,
              0,
              0,
              0,
              wearableIds[0],
              wearableIds[0],
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
            ],
            itemDepositIds
          )
      ).to.be.revertedWith("ItemsFacet: Not enough delegated balance");
    });
    it("should equip delegated wearables in two gotchis with the same depositId and unequip all with withdraw", async () => {
      RoleAssignment = await buildRoleAssignment({
        tokenAddress: wearablesFacet.address,
        tokenId: wearableIds[1],
        tokenAmount: 2,
        grantor: grantor.address,
        grantee: LargeGotchiOwner,
      });

      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(RoleAssignment)
      ).to.not.be.reverted;

      const anotherGotchiId = LargeGotchiOwnerAavegotchis[1];
      const itemDepositIds: ItemDepositId[] = new Array(16).fill({
        nonce: BigNumber.from(0),
        grantor: AddressZero,
      });
      itemDepositIds[2] = {
        nonce: RoleAssignment.nonce,
        grantor: RoleAssignment.grantor,
      };
      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            [0, 0, wearableIds[1], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            itemDepositIds
          )
      )
        .to.emit(libERC1155, "TransferToParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[1], 1)
        .to.not.emit(libEventHandler, "TransferSingle");

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            anotherGotchiId,
            [0, 0, wearableIds[1], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            itemDepositIds
          )
      )
        .to.emit(libERC1155, "TransferToParent")
        .withArgs(aavegotchiDiamondAddress, anotherGotchiId, wearableIds[1], 1)
        .to.not.emit(libEventHandler, "TransferSingle");

      await expect(
        ItemsRolesRegistryFacet.connect(grantor).withdrawFrom(
          RoleAssignment.nonce,
          RoleAssignment.grantor
        )
      )
        .to.emit(libERC1155, "TransferFromParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[1], 1)
        .to.emit(libERC1155, "TransferFromParent")
        .withArgs(aavegotchiDiamondAddress, anotherGotchiId, wearableIds[1], 1)
        .to.emit(libEventHandler, "TransferSingle")
        .withArgs(
          grantor.address,
          aavegotchiDiamondAddress,
          grantor.address,
          wearableIds[1],
          2
        );
    });
    it('should NOT transfer an aavegotchi with delegated wearable equipped', async () => {
      const anotherGotchiId = LargeGotchiOwnerAavegotchis[1];
      const itemDepositIds: ItemDepositId[] = new Array(16).fill({
        nonce: BigNumber.from(0),
        grantor: AddressZero,
      });

      itemDepositIds[3] = {
        nonce: RoleAssignment.nonce,
        grantor: RoleAssignment.grantor,
      };

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            anotherGotchiId,
            [0, 0, 0, wearableIds[3], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            itemDepositIds
          )
      )
        .to.emit(libERC1155, "TransferToParent")
        .withArgs(aavegotchiDiamondAddress, anotherGotchiId, wearableIds[3], 1)
        .to.not.emit(libEventHandler, "TransferSingle");

      await expect(
        aavegotchiFacet.connect(grantee).transferFrom(
          await grantee.getAddress(),
          grantor.address,
          anotherGotchiId,
        )
      ).to.be.revertedWith("AavegotchiFacet: Can't transfer when equipped with a delegated wearable");
      
      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            anotherGotchiId,
            emptyWearableIds,
            emptyItemDepositIds
          )
      )
        .to.emit(libERC1155, "TransferFromParent")
        .withArgs(aavegotchiDiamondAddress, anotherGotchiId, wearableIds[3], 1)
        .to.not.emit(libEventHandler, "TransferSingle");
    })
    it("should equip and unequip two gloves one not and one delegated", async () => {
      await wearablesFacet
        .connect(grantor)
        .safeTransferFrom(
          grantor.address,
          LargeGotchiOwner,
          wearableIds[0],
          1,
          "0x"
        );

      const granteeAddress = await grantee.getAddress();
      const newRoleAssignment1 = await buildRoleAssignment({
        tokenAddress: wearablesFacet.address,
        tokenId: wearableIds[0],
        grantor: grantor.address,
        grantee: granteeAddress,
        tokenAmount: 1,
      });

      await ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(
        newRoleAssignment1
      )

      const anotherGotchiId = LargeGotchiOwnerAavegotchis[1];
      const itemDepositIds: ItemDepositId[] = new Array(16).fill({
        nonce: 0,
        grantor: AddressZero,
      });

      itemDepositIds[4] = {
        nonce: newRoleAssignment1.nonce,
        grantor: newRoleAssignment1.grantor,
      };

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            anotherGotchiId,
            [0, 0, 0, 0, wearableIds[0], wearableIds[0], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            itemDepositIds
          )
      )
        .to.emit(libERC1155, "TransferToParent")
        .withArgs(aavegotchiDiamondAddress, anotherGotchiId, wearableIds[0], 1)
        .to.emit(libEventHandler, "TransferSingle")
        .withArgs(
          granteeAddress,
          granteeAddress,
          aavegotchiDiamondAddress,
          wearableIds[0],
          1
        )

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            anotherGotchiId,
            emptyWearableIds,
            emptyItemDepositIds
          )
      ).to.emit(libEventHandler, "TransferSingle")
          .withArgs(
            granteeAddress,
            aavegotchiDiamondAddress,
            granteeAddress,
            wearableIds[0],
            1
          )
        .to.emit(libERC1155, "TransferFromParent")
        .withArgs(aavegotchiDiamondAddress, anotherGotchiId, wearableIds[0], 1)
    })
    it('should equip and unequp two gloves one delegated one not', async () => {
      await wearablesFacet
        .connect(grantor)
        .safeTransferFrom(
          grantor.address,
          LargeGotchiOwner,
          wearableIds[0],
          1,
          "0x"
        );

      const granteeAddress = await grantee.getAddress();
      const newRoleAssignment1 = await buildRoleAssignment({
        tokenAddress: wearablesFacet.address,
        tokenId: wearableIds[0],
        grantor: grantor.address,
        grantee: granteeAddress,
        tokenAmount: 1,
      });

      await ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(
        newRoleAssignment1
      )

      const anotherGotchiId = LargeGotchiOwnerAavegotchis[1];
      const itemDepositIds: ItemDepositId[] = new Array(16).fill({
        nonce: 0,
        grantor: AddressZero,
      });

      itemDepositIds[5] = {
        nonce: newRoleAssignment1.nonce,
        grantor: newRoleAssignment1.grantor,
      };

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            anotherGotchiId,
            [0, 0, 0, 0, wearableIds[0], wearableIds[0], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            itemDepositIds
          )
      )
        .to.emit(libERC1155, "TransferToParent")
        .withArgs(aavegotchiDiamondAddress, anotherGotchiId, wearableIds[0], 1)
        .to.emit(libEventHandler, "TransferSingle")
        .withArgs(
          granteeAddress,
          granteeAddress,
          aavegotchiDiamondAddress,
          wearableIds[0],
          1
        )

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            anotherGotchiId,
            emptyWearableIds,
            emptyItemDepositIds
          )
      ).to.emit(libEventHandler, "TransferSingle")
          .withArgs(
            granteeAddress,
            aavegotchiDiamondAddress,
            granteeAddress,
            wearableIds[0],
            1
          )
        .to.emit(libERC1155, "TransferFromParent")
        .withArgs(aavegotchiDiamondAddress, anotherGotchiId, wearableIds[0], 1)
    })
    it('should NOT transfer an aavegotchi with mixed wearables equipped', async () => {
      await wearablesFacet
        .connect(grantor)
        .safeTransferFrom(
          grantor.address,
          LargeGotchiOwner,
          wearableIds[0],
          2,
          "0x"
        );

      const granteeAddress = await grantee.getAddress();
      const newRoleAssignment1 = await buildRoleAssignment({
        tokenAddress: wearablesFacet.address,
        tokenId: wearableIds[1],
        grantor: grantor.address,
        grantee: granteeAddress,
        tokenAmount: 1,
      });

      const newRoleAssignment2 = await buildRoleAssignment({
        tokenAddress: wearablesFacet.address,
        tokenId: wearableIds[5],
        grantor: grantor.address,
        grantee: granteeAddress,
        tokenAmount: 1,
      });

      await ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(
        newRoleAssignment1
      )
      await ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(
        newRoleAssignment2
      );

      const anotherGotchiId = LargeGotchiOwnerAavegotchis[1];
      const itemDepositIds: ItemDepositId[] = new Array(16).fill({
        nonce: BigNumber.from(0),
        grantor: AddressZero,
      });

      itemDepositIds[2] = {
        nonce: newRoleAssignment1.nonce,
        grantor: newRoleAssignment1.grantor,
      };
      itemDepositIds[3] = {
        nonce: RoleAssignment.nonce,
        grantor: RoleAssignment.grantor,
      };
      itemDepositIds[6] = {
        nonce: newRoleAssignment2.nonce,
        grantor: newRoleAssignment2.grantor,
      };

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            anotherGotchiId,
            [0, 0, wearableIds[1], wearableIds[3], wearableIds[0], wearableIds[0], wearableIds[5], 0, 0, 0, 0, 0, 0, 0, 0, 0],
            itemDepositIds
          )
      )
        .to.emit(libERC1155, "TransferToParent")
        .withArgs(aavegotchiDiamondAddress, anotherGotchiId, wearableIds[3], 1)
        .to.emit(libEventHandler, "TransferSingle")
        .withArgs(
          LargeGotchiOwner,
          LargeGotchiOwner,
          aavegotchiDiamondAddress,
          wearableIds[0],
          2
        )

      await expect(aavegotchiFacet.connect(grantee).transferFrom(granteeAddress, grantor.address, anotherGotchiId))
        .to.be.revertedWith("AavegotchiFacet: Can't transfer when equipped with a delegated wearable");

      // Unequip wearables [1] and [3]
      itemDepositIds[2] = {
        nonce: 0,
        grantor: AddressZero,
      };
      itemDepositIds[3] = {
        nonce: 0,
        grantor: AddressZero,
      };
      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            anotherGotchiId,
            [0, 0, 0, 0, wearableIds[0], wearableIds[0], wearableIds[5], 0, 0, 0, 0, 0, 0, 0, 0, 0],
            itemDepositIds
          )
      ).to.emit(libERC1155, "TransferFromParent")
        .withArgs(aavegotchiDiamondAddress, anotherGotchiId, wearableIds[1], 1)
        .to.emit(libERC1155, "TransferFromParent")
        .withArgs(aavegotchiDiamondAddress, anotherGotchiId, wearableIds[3], 1)
        .to.not.emit(libEventHandler, "TransferSingle");

        await expect(aavegotchiFacet.connect(grantee).transferFrom(granteeAddress, grantor.address, anotherGotchiId))
        .to.be.revertedWith("AavegotchiFacet: Can't transfer when equipped with a delegated wearable");
      // Unequip wearables [0]

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            anotherGotchiId,
            [0, 0, 0, 0, 0, 0, wearableIds[5], 0, 0, 0, 0, 0, 0, 0, 0, 0],
            itemDepositIds
          )
      ).to.emit(libEventHandler, "TransferSingle")
          .withArgs(
            granteeAddress,
            aavegotchiDiamondAddress,
            granteeAddress,
            wearableIds[0],
            1
          )
        .to.emit(libEventHandler, "TransferSingle")
          .withArgs(
            granteeAddress,
            aavegotchiDiamondAddress,
            granteeAddress,
            wearableIds[0],
            1
          )
        
      await expect(aavegotchiFacet.connect(grantee).transferFrom(granteeAddress, grantor.address, anotherGotchiId))
      .to.be.revertedWith("AavegotchiFacet: Can't transfer when equipped with a delegated wearable");

      // Unequip wearables [5]
      itemDepositIds[6] = {
        nonce: 0,
        grantor: AddressZero,
      };

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            anotherGotchiId,
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            itemDepositIds
          )
      ).to.emit(libERC1155, "TransferFromParent")
      .withArgs(aavegotchiDiamondAddress, anotherGotchiId, wearableIds[5], 1)
      .to.not.emit(libEventHandler, "TransferSingle");

      await expect(aavegotchiFacet.connect(grantee).transferFrom(granteeAddress, grantor.address, anotherGotchiId)).to.not.be.reverted;
    })
    it("should NOT equip a delegated wearable if the depositId is expired", async () => {
      await network.provider.send("evm_increaseTime", [ONE_DAY]);
      const itemDepositIds: ItemDepositId[] = new Array(16).fill({
        nonce: BigNumber.from(0),
        grantor: AddressZero,
      });
      itemDepositIds[3] = {
        nonce: RoleAssignment.nonce,
        grantor: RoleAssignment.grantor,
      };

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            [0, 0, 0, wearableIds[3], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            itemDepositIds
          )
      ).to.be.revertedWith("ItemsFacet: Wearable delegation expired");
    });
  });
});
