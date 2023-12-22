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
  wearableDiamondAddress,
  wearableIds,
  generateRandomInt,
  ONE_DAY,
  buildRecord,
  buildGrantRole,
  time,
} from "./helpers";
import { itemManagerAlt } from "../../scripts/helperFunctions";
import { upgradeWithNewFacets } from "./upgradeScript";
import { GrantRoleData, Record } from "./types";

const { expect } = chai;

const AddressZero = ethers.constants.AddressZero;

describe("ItemsFacet", async () => {
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
  const emptyItemRecordIds = new Array(16).fill(BigNumber.from(0));
  const emptyWearableIds: number[] = new Array(16).fill(BigNumber.from(0));
  const granteeAddress = LargeGotchiOwner;

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
        "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
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

    await daoFacet.updateItemTypeMaxQuantity(
      wearableIds,
      wearableIds.map(() => 2000)
    );
    await daoFacet.mintItems(
      grantor.address,
      wearableIds,
      wearableIds.map(() => 1000)
    );
  });

  describe("equipDelegatedWearables", () => {
    let RecordCreated: Record;
    let GrantRoleData: GrantRoleData;
    let recordIdsCounter = 0;
    let itemRecordIds: Number[];
    let wearableIdsToEquip: Number[];

    beforeEach(async () => {
      itemRecordIds = new Array(16).fill(0);
      wearableIdsToEquip = new Array(16).fill(0);

      RecordCreated = buildRecord({
        grantor: grantor.address,
        tokenAddress: wearableDiamondAddress,
        tokenId: wearableIds[3],
      });
      ++recordIdsCounter;
      GrantRoleData = await buildGrantRole({
        recordId: recordIdsCounter,
        grantee: granteeAddress,
      });
      await wearablesFacet
        .connect(grantor)
        .setApprovalForAll(ItemsRolesRegistryFacet.address, true);

      await ItemsRolesRegistryFacet.connect(grantor).createRecordFrom(
        RecordCreated.grantor,
        RecordCreated.tokenAddress,
        RecordCreated.tokenId,
        RecordCreated.tokenAmount
      );
      await ItemsRolesRegistryFacet.connect(grantor).grantRole(
        GrantRoleData.recordId,
        GrantRoleData.role,
        GrantRoleData.grantee,
        GrantRoleData.expirationDate,
        GrantRoleData.revocable,
        GrantRoleData.data
      );
    });

    it("should equip and unequip delegated wearable", async () => {
      itemRecordIds[3] = GrantRoleData.recordId;
      wearableIdsToEquip[3] = wearableIds[3];

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(gotchiId, wearableIdsToEquip, itemRecordIds)
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
            emptyItemRecordIds
          )
      )
        .to.emit(libERC1155, "TransferFromParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[3], 1)
        .to.not.emit(libEventHandler, "TransferSingle");
    });
    it("should unequip a delegated wearable when the role is revoked", async () => {
      itemRecordIds[3] = GrantRoleData.recordId;
      wearableIdsToEquip[3] = wearableIds[3];
      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(gotchiId, wearableIdsToEquip, itemRecordIds)
      )
        .to.emit(libERC1155, "TransferToParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[3], 1)
        .to.not.emit(libEventHandler, "TransferSingle");

      await expect(
        ItemsRolesRegistryFacet.connect(grantor).revokeRoleFrom(
          GrantRoleData.recordId,
          GrantRoleData.role,
          granteeAddress
        )
      )
        .to.emit(libERC1155, "TransferFromParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[3], 1)
        .to.not.emit(libEventHandler, "TransferSingle");
    });
    it("should equip and unequip delegated hand wearables", async () => {
      const { GrantRoleData: newGrantRoleData } = await createRoleAssignment(
        ++recordIdsCounter,
        wearableIds[0],
        2
      );
      // wearables[0] -> hands
      itemRecordIds[4] = newGrantRoleData.recordId;
      itemRecordIds[5] = newGrantRoleData.recordId;
      wearableIdsToEquip[4] = wearableIds[0];
      wearableIdsToEquip[5] = wearableIds[0];

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(gotchiId, wearableIdsToEquip, itemRecordIds)
      )
        .to.emit(libERC1155, "TransferToParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[0], 1)
        .to.emit(libERC1155, "TransferToParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[0], 1)
        .to.not.emit(libEventHandler, "TransferSingle");

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            emptyWearableIds,
            emptyItemRecordIds
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

      itemRecordIds[3] = GrantRoleData.recordId;
      wearableIdsToEquip[3] = wearableIds[3];
      wearableIdsToEquip[4] = wearableIds[0];
      wearableIdsToEquip[5] = wearableIds[0];

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(gotchiId, wearableIdsToEquip, itemRecordIds)
      )
        .to.emit(libERC1155, "TransferToParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[3], 1)
        .to.emit(libEventHandler, "TransferSingle")
        .withArgs(
          LargeGotchiOwner,
          LargeGotchiOwner,
          aavegotchiDiamondAddress,
          wearableIds[0],
          1
        )
        .to.emit(libEventHandler, "TransferSingle")
        .withArgs(
          LargeGotchiOwner,
          LargeGotchiOwner,
          aavegotchiDiamondAddress,
          wearableIds[0],
          1
        );

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            emptyWearableIds,
            emptyItemRecordIds
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
      const { GrantRoleData, RecordCreated } = await createRoleAssignment(
        ++recordIdsCounter,
        wearableIds[1],
        2
      );

      itemRecordIds[2] = GrantRoleData.recordId;
      wearableIdsToEquip[2] = wearableIds[1];

      const anotherGotchiId = LargeGotchiOwnerAavegotchis[1];
      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(gotchiId, wearableIdsToEquip, itemRecordIds)
      )
        .to.emit(libERC1155, "TransferToParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[1], 1)
        .to.not.emit(libEventHandler, "TransferSingle");

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            anotherGotchiId,
            wearableIdsToEquip,
            itemRecordIds
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
            wearableIdsToEquip,
            itemRecordIds
          )
      ).to.be.revertedWith("ItemsFacet: Not enough delegated balance");

      await expect(
        ItemsRolesRegistryFacet.connect(grantor).revokeRoleFrom(
          GrantRoleData.recordId,
          GrantRoleData.role,
          granteeAddress
        )
      )
        .to.emit(libERC1155, "TransferFromParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[1], 1)
        .to.emit(libERC1155, "TransferFromParent")
        .withArgs(aavegotchiDiamondAddress, anotherGotchiId, wearableIds[1], 1)
        .to.not.emit(libEventHandler, "TransferSingle");
    });
    it("should NOT equip a delegated wearable if the depositId is from another wearable", async () => {
      itemRecordIds[3] = GrantRoleData.recordId;
      wearableIdsToEquip[3] = wearableIds[2];

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(gotchiId, wearableIdsToEquip, itemRecordIds)
      ).to.be.revertedWith(
        "ItemsFacet: Delegated Wearable not of this delegation"
      );
    });
    it("should NOT equip a delegated wearable if the grantee is invalid for respective depositId", async () => {
      const { GrantRoleData } = await createRoleAssignment(
        ++recordIdsCounter,
        wearableIds[2],
        1,
        anotherUser.address
      );

      itemRecordIds[3] = GrantRoleData.recordId;
      wearableIdsToEquip[3] = wearableIds[2];

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(gotchiId, wearableIdsToEquip, itemRecordIds)
      ).to.be.revertedWith(
        "ItemsFacet: Wearable not delegated to sender or recordId not valid"
      );
    });
    it("should NOT equip a delegated wearable if the depositId does not exist", async () => {
      await createRoleAssignment(++recordIdsCounter, wearableIds[2], 1);

      const wrongDepositId = generateRandomInt();
      itemRecordIds[3] = wrongDepositId;
      wearableIdsToEquip[3] = wearableIds[2];

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(gotchiId, wearableIdsToEquip, itemRecordIds)
      ).to.be.revertedWith(
        "ItemsFacet: Wearable not delegated to sender or recordId not valid"
      );
    });
    it("should NOT equip a delegated wearable if the wearable is all delegated balance is already equipped in other gotchi", async () => {
      itemRecordIds[3] = GrantRoleData.recordId;
      wearableIdsToEquip[3] = wearableIds[3];

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(gotchiId, wearableIdsToEquip, itemRecordIds)
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
            wearableIdsToEquip,
            itemRecordIds
          )
      ).to.be.revertedWith("ItemsFacet: Not enough delegated balance");

      // unequip for next test
      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            emptyWearableIds,
            emptyItemRecordIds
          )
      )
        .to.emit(libERC1155, "TransferFromParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[3], 1)
        .to.not.emit(libEventHandler, "TransferSingle");
    });
    it("should NOT equip a delegated wearable if sender doesn't enough delegated balance", async function () {
      const { GrantRoleData: newGrantRoleData } = await createRoleAssignment(
        ++recordIdsCounter,
        wearableIds[0],
        1
      );

      itemRecordIds[4] = newGrantRoleData.recordId;
      itemRecordIds[5] = newGrantRoleData.recordId;
      wearableIdsToEquip[4] = wearableIds[0];
      wearableIdsToEquip[5] = wearableIds[0];

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(gotchiId, wearableIdsToEquip, itemRecordIds)
      ).to.be.revertedWith("ItemsFacet: Not enough delegated balance");
    });
    it("should equip delegated wearables in two gotchis with the same depositId and unequip all with withdraw", async () => {
      const { GrantRoleData } = await createRoleAssignment(
        ++recordIdsCounter,
        wearableIds[1],
        2
      );

      const anotherGotchiId = LargeGotchiOwnerAavegotchis[1];

      (itemRecordIds[2] = GrantRoleData.recordId),
        (wearableIdsToEquip[2] = wearableIds[1]);

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(gotchiId, wearableIdsToEquip, itemRecordIds)
      )
        .to.emit(libERC1155, "TransferToParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[1], 1)
        .to.not.emit(libEventHandler, "TransferSingle");

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            anotherGotchiId,
            wearableIdsToEquip,
            itemRecordIds
          )
      )
        .to.emit(libERC1155, "TransferToParent")
        .withArgs(aavegotchiDiamondAddress, anotherGotchiId, wearableIds[1], 1)
        .to.not.emit(libEventHandler, "TransferSingle");

      await expect(
        ItemsRolesRegistryFacet.connect(grantor).withdrawFrom(
          GrantRoleData.recordId
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
    describe("edge cases", () => {
      it("should NOT transfer an aavegotchi with delegated wearable equipped", async () => {
        const anotherGotchiId = LargeGotchiOwnerAavegotchis[1];

        (itemRecordIds[3] = GrantRoleData.recordId),
          (wearableIdsToEquip[3] = wearableIds[3]);

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              wearableIdsToEquip,
              itemRecordIds
            )
        )
          .to.emit(libERC1155, "TransferToParent")
          .withArgs(
            aavegotchiDiamondAddress,
            anotherGotchiId,
            wearableIds[3],
            1
          )
          .to.not.emit(libEventHandler, "TransferSingle");

        await expect(
          aavegotchiFacet
            .connect(grantee)
            .transferFrom(
              await grantee.getAddress(),
              grantor.address,
              anotherGotchiId
            )
        ).to.be.revertedWith(
          "AavegotchiFacet: Can't transfer when equipped with a delegated wearable"
        );

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              emptyWearableIds,
              emptyItemRecordIds
            )
        )
          .to.emit(libERC1155, "TransferFromParent")
          .withArgs(
            aavegotchiDiamondAddress,
            anotherGotchiId,
            wearableIds[3],
            1
          )
          .to.not.emit(libEventHandler, "TransferSingle");
      });
      it("should equip and unequp two gloves one delegated and one not", async () => {
        await wearablesFacet
          .connect(grantor)
          .safeTransferFrom(
            grantor.address,
            LargeGotchiOwner,
            wearableIds[0],
            1,
            "0x"
          );
        const { GrantRoleData: newGrantRoleData1 } = await createRoleAssignment(
          ++recordIdsCounter,
          wearableIds[0],
          1
        );

        const anotherGotchiId = LargeGotchiOwnerAavegotchis[1];

        itemRecordIds[5] = newGrantRoleData1.recordId;
        wearableIdsToEquip[5] = wearableIds[0];
        wearableIdsToEquip[4] = wearableIds[0];

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              wearableIdsToEquip,
              itemRecordIds
            )
        )
          .to.emit(libERC1155, "TransferToParent")
          .withArgs(
            aavegotchiDiamondAddress,
            anotherGotchiId,
            wearableIds[0],
            1
          )
          .to.emit(libEventHandler, "TransferSingle")
          .withArgs(
            granteeAddress,
            granteeAddress,
            aavegotchiDiamondAddress,
            wearableIds[0],
            1
          );

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              emptyWearableIds,
              emptyItemRecordIds
            )
        )
          .to.emit(libEventHandler, "TransferSingle")
          .withArgs(
            granteeAddress,
            aavegotchiDiamondAddress,
            granteeAddress,
            wearableIds[0],
            1
          )
          .to.emit(libERC1155, "TransferFromParent")
          .withArgs(
            aavegotchiDiamondAddress,
            anotherGotchiId,
            wearableIds[0],
            1
          );
      });
      it("should equip two gloves one delegated and one not and unequip the left hand first and then the right", async () => {
        await wearablesFacet
          .connect(grantor)
          .safeTransferFrom(
            grantor.address,
            LargeGotchiOwner,
            wearableIds[0],
            1,
            "0x"
          );
        const { GrantRoleData: newGrantRoleData1 } = await createRoleAssignment(
          ++recordIdsCounter,
          wearableIds[0],
          1
        );

        const anotherGotchiId = LargeGotchiOwnerAavegotchis[1];

        itemRecordIds[5] = newGrantRoleData1.recordId
        wearableIdsToEquip[5] = wearableIds[0];
        wearableIdsToEquip[4] = wearableIds[0];
         
        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              wearableIdsToEquip,
              itemRecordIds
            )
        )
          .to.emit(libERC1155, "TransferToParent")
          .withArgs(
            aavegotchiDiamondAddress,
            anotherGotchiId,
            wearableIds[0],
            1
          )
          .to.emit(libEventHandler, "TransferSingle")
          .withArgs(
            granteeAddress,
            granteeAddress,
            aavegotchiDiamondAddress,
            wearableIds[0],
            1
          );

        wearableIdsToEquip[4] = 0;
        itemRecordIds[4] = 0;

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              [0, 0, 0, 0, wearableIds[0], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              itemRecordIds
            )
        )
          .to.emit(libERC1155, "TransferFromParent")
          .withArgs(
            aavegotchiDiamondAddress,
            anotherGotchiId,
            wearableIds[0],
            1
          )
          .to.not.emit(libEventHandler, "TransferSingle");

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              emptyWearableIds,
              emptyItemRecordIds
            )
        )
          .to.emit(libEventHandler, "TransferSingle")
          .withArgs(
            granteeAddress,
            aavegotchiDiamondAddress,
            granteeAddress,
            wearableIds[0],
            1
          )
          .to.emit(libERC1155, "TransferFromParent")
          .withArgs(
            aavegotchiDiamondAddress,
            anotherGotchiId,
            wearableIds[0],
            1
          );
      });
      it("should equip two gloves one both delegated and unequip the right hand first and then the left with revokeRoleFrom", async () => {
        const { GrantRoleData: newGrantRoleData1 } = await createRoleAssignment(++recordIdsCounter, wearableIds[0], 2);

        const anotherGotchiId = LargeGotchiOwnerAavegotchis[1];

        itemRecordIds[4] = newGrantRoleData1.recordId
        itemRecordIds[5] = newGrantRoleData1.recordId
        wearableIdsToEquip[4] = wearableIds[0];
        wearableIdsToEquip[5] = wearableIds[0];

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              wearableIdsToEquip,
              itemRecordIds
            )
        )
          .to.emit(libERC1155, "TransferToParent")
          .withArgs(
            aavegotchiDiamondAddress,
            anotherGotchiId,
            wearableIds[0],
            1
          )
          .to.emit(libERC1155, "TransferToParent")
          .withArgs(
            aavegotchiDiamondAddress,
            anotherGotchiId,
            wearableIds[0],
            1
          );

        itemRecordIds[5] = 0
        wearableIdsToEquip[5] = 0;

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              wearableIdsToEquip,
              itemRecordIds
            )
        )
          .to.emit(libERC1155, "TransferFromParent")
          .withArgs(
            aavegotchiDiamondAddress,
            anotherGotchiId,
            wearableIds[0],
            1
          )
          .to.not.emit(libEventHandler, "TransferSingle");

        await expect(
          ItemsRolesRegistryFacet.connect(grantor).revokeRoleFrom(
            newGrantRoleData1.recordId,
            newGrantRoleData1.role,
            newGrantRoleData1.grantee,
          )
        )
          .to.emit(libERC1155, "TransferFromParent")
          .withArgs(
            aavegotchiDiamondAddress,
            anotherGotchiId,
            wearableIds[0],
            1
          );
      });
      it("should NOT transfer an aavegotchi with mixed wearables equipped", async () => {
        await wearablesFacet
          .connect(grantor)
          .safeTransferFrom(
            grantor.address,
            LargeGotchiOwner,
            wearableIds[0],
            2,
            "0x"
          );
        
        const { GrantRoleData: newGrantRoleData1 } = await createRoleAssignment(++recordIdsCounter, wearableIds[1], 1);
        const { GrantRoleData: newGrantRoleData2 } = await createRoleAssignment(++recordIdsCounter, wearableIds[5], 1);


        const anotherGotchiId = LargeGotchiOwnerAavegotchis[3];

        itemRecordIds[2] = newGrantRoleData1.recordId,
        itemRecordIds[3] = GrantRoleData.recordId,
        itemRecordIds[6] = newGrantRoleData2.recordId,
        wearableIdsToEquip[2] = wearableIds[1];
        wearableIdsToEquip[3] = wearableIds[3];
        wearableIdsToEquip[4] = wearableIds[0];
        wearableIdsToEquip[5] = wearableIds[0];
        wearableIdsToEquip[6] = wearableIds[5];
         

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              wearableIdsToEquip,
              itemRecordIds
            )
        )
          .to.emit(libERC1155, "TransferToParent")
          .withArgs(
            aavegotchiDiamondAddress,
            anotherGotchiId,
            wearableIds[3],
            1
          )
          .to.emit(libEventHandler, "TransferSingle")
          .withArgs(
            LargeGotchiOwner,
            LargeGotchiOwner,
            aavegotchiDiamondAddress,
            wearableIds[0],
            1
          )
          .to.emit(libEventHandler, "TransferSingle")
          .withArgs(
            LargeGotchiOwner,
            LargeGotchiOwner,
            aavegotchiDiamondAddress,
            wearableIds[0],
            1
          );

        await expect(
          aavegotchiFacet
            .connect(grantee)
            .transferFrom(granteeAddress, grantor.address, anotherGotchiId)
        ).to.be.revertedWith(
          "AavegotchiFacet: Can't transfer when equipped with a delegated wearable"
        );

        // Unequip wearables [1] and [3]
        itemRecordIds[2] = 0
        itemRecordIds[3] = 0
        wearableIdsToEquip[2] = 0;
        wearableIdsToEquip[3] = 0;

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              wearableIdsToEquip,
              itemRecordIds
            )
        )
          .to.emit(libERC1155, "TransferFromParent")
          .withArgs(
            aavegotchiDiamondAddress,
            anotherGotchiId,
            wearableIds[1],
            1
          )
          .to.emit(libERC1155, "TransferFromParent")
          .withArgs(
            aavegotchiDiamondAddress,
            anotherGotchiId,
            wearableIds[3],
            1
          )
          .to.not.emit(libEventHandler, "TransferSingle");

        await expect(
          aavegotchiFacet
            .connect(grantee)
            .transferFrom(granteeAddress, grantor.address, anotherGotchiId)
        ).to.be.revertedWith(
          "AavegotchiFacet: Can't transfer when equipped with a delegated wearable"
        );

        // Unequip wearables [0]
        wearableIdsToEquip[4] = 0;
        wearableIdsToEquip[5] = 0;

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              wearableIdsToEquip,
              itemRecordIds
            )
        )
          .to.emit(libEventHandler, "TransferSingle")
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
          );

        await expect(
          aavegotchiFacet
            .connect(grantee)
            .transferFrom(granteeAddress, grantor.address, anotherGotchiId)
        ).to.be.revertedWith(
          "AavegotchiFacet: Can't transfer when equipped with a delegated wearable"
        );

        // Unequip wearables [5]
        itemRecordIds[6] = 0
        wearableIdsToEquip[6] = 0;

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              wearableIdsToEquip,
              itemRecordIds
            )
        )
          .to.emit(libERC1155, "TransferFromParent")
          .withArgs(
            aavegotchiDiamondAddress,
            anotherGotchiId,
            wearableIds[5],
            1
          )
          .to.not.emit(libEventHandler, "TransferSingle");

        await expect(
          aavegotchiFacet
            .connect(grantee)
            .transferFrom(granteeAddress, grantor.address, anotherGotchiId)
        ).to.not.be.reverted;
      });
      it("should equip and unequp two gloves one delegated one not and then equip another of the same delegation and id", async () => {
        await wearablesFacet
          .connect(grantor)
          .safeTransferFrom(
            grantor.address,
            LargeGotchiOwner,
            wearableIds[0],
            1,
            "0x"
          );

        const { GrantRoleData: newGrantRoleData1 } = await createRoleAssignment(++recordIdsCounter, wearableIds[0], 2);
        
        const anotherGotchiId = LargeGotchiOwnerAavegotchis[1];

        itemRecordIds[5] = newGrantRoleData1.recordId,
        wearableIdsToEquip[5] = wearableIds[0];
        wearableIdsToEquip[4] = wearableIds[0];
         

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              wearableIdsToEquip,
              itemRecordIds
            )
        )
          .to.emit(libERC1155, "TransferToParent")
          .withArgs(
            aavegotchiDiamondAddress,
            anotherGotchiId,
            wearableIds[0],
            1
          )
          .to.emit(libEventHandler, "TransferSingle")
          .withArgs(
            granteeAddress,
            granteeAddress,
            aavegotchiDiamondAddress,
            wearableIds[0],
            1
          );

        itemRecordIds[4] = newGrantRoleData1.recordId,

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              wearableIdsToEquip,
              itemRecordIds
            )
        )
          .to.emit(libEventHandler, "TransferSingle")
          .withArgs(
            granteeAddress,
            aavegotchiDiamondAddress,
            granteeAddress,
            wearableIds[0],
            1
          )
          .to.emit(libERC1155, "TransferFromParent")
          .withArgs(
            aavegotchiDiamondAddress,
            anotherGotchiId,
            wearableIds[0],
            1
          )
          .to.emit(libERC1155, "TransferToParent")
          .withArgs(
            aavegotchiDiamondAddress,
            anotherGotchiId,
            wearableIds[0],
            1
          );
      });
      it('should equip and unequip two gloves of the same delegation and id, and then equip another with the same id but from another delegation', async function () {
        await wearablesFacet
          .connect(grantor)
          .safeTransferFrom(
            grantor.address,
            LargeGotchiOwner,
            wearableIds[0],
            1,
            "0x"
          );

        const { GrantRoleData: newGrantRoleData1 } = await createRoleAssignment(++recordIdsCounter, wearableIds[0], 2);
        const { GrantRoleData: newGrantRoleData2 } = await createRoleAssignment(++recordIdsCounter, wearableIds[0], 2);

        const anotherGotchiId = LargeGotchiOwnerAavegotchis[2];

        itemRecordIds[4] = newGrantRoleData1.recordId
        itemRecordIds[5] = newGrantRoleData1.recordId
        wearableIdsToEquip[4] = wearableIds[0];
        wearableIdsToEquip[5] = wearableIds[0];
         

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              wearableIdsToEquip,
              itemRecordIds
            )
        ).to.emit(libERC1155, "TransferToParent")
          .withArgs(
            aavegotchiDiamondAddress,
            anotherGotchiId,
            wearableIds[0],
            1
          )
          .to.emit(libERC1155, "TransferToParent")
          .withArgs(
            aavegotchiDiamondAddress,
            anotherGotchiId,
            wearableIds[0],
            1
          );

        itemRecordIds[5] = newGrantRoleData2.recordId,

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              wearableIdsToEquip,
              itemRecordIds
            )
        )
          .to.emit(libERC1155, "TransferFromParent")
          .withArgs(
            aavegotchiDiamondAddress,
            anotherGotchiId,
            wearableIds[0],
            1
          )
          .to.emit(libERC1155, "TransferToParent")
          .withArgs(
            aavegotchiDiamondAddress,
            anotherGotchiId,
            wearableIds[0],
            1
          );
      })
      it("should NOT equip a delegated wearable if the depositId is expired", async () => {
        await time.increase(ONE_DAY)
       
        itemRecordIds[3] = GrantRoleData.recordId
        wearableIdsToEquip[3] = wearableIds[3];
         
        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              gotchiId,
              wearableIdsToEquip,
              itemRecordIds
            )
        ).to.be.revertedWith("ItemsFacet: Wearable delegation expired");
      });
    });
  });

  async function createRoleAssignment(
    recordId: number,
    tokenId: number,
    tokenAmount: number,
    grantee: string = granteeAddress
  ) {
    const RecordCreated = buildRecord({
      grantor: grantor.address,
      tokenId,
      tokenAmount,
    });
    const GrantRoleData = await buildGrantRole({
      recordId,
      grantee,
    });

    await ItemsRolesRegistryFacet.connect(grantor).createRecordFrom(
      RecordCreated.grantor,
      RecordCreated.tokenAddress,
      RecordCreated.tokenId,
      RecordCreated.tokenAmount
    );
    // wearables[0] -> hands
    await ItemsRolesRegistryFacet.connect(grantor).grantRole(
      GrantRoleData.recordId,
      GrantRoleData.role,
      GrantRoleData.grantee,
      GrantRoleData.expirationDate,
      GrantRoleData.revocable,
      GrantRoleData.data
    );
    return { GrantRoleData, RecordCreated };
  }
});
