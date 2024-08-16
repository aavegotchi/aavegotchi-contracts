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
  ERC721MarketplaceFacet,
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
  buildCommitment,
  buildGrantRole,
  time,
} from "./helpers";
import { itemManagerAlt } from "../../scripts/helperFunctions";
import { GrantRoleData, Commitment } from "./types";
import { upgradeItemsFacetOnly } from "./deployTest";
import { LibItemsEvents } from "../../typechain/LibItemsEvents";

const { expect } = chai;

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
  let ERC721MarketplaceFacet: ERC721MarketplaceFacet;
  let libItemsEvents: LibItemsEvents;

  const gotchiId = LargeGotchiOwnerAavegotchis[0];
  const anotherGotchiId = LargeGotchiOwnerAavegotchis[10];
  const emptyItemdepositIds = new Array(16).fill(BigNumber.from(0));
  const emptyWearableIds: number[] = new Array(16).fill(BigNumber.from(0));
  const granteeAddress = LargeGotchiOwner;

  before(async () => {
    //reset hardat fork
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: process.env.MATIC_URL,
          },
        },
      ],
    });

    const signers = await ethers.getSigners();
    grantor = signers[0];
    anotherUser = signers[2];

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [LargeGotchiOwner],
    });
    grantee = await ethers.provider.getSigner(LargeGotchiOwner);

    await upgradeItemsFacetOnly();

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

    ERC721MarketplaceFacet = (await ethers.getContractAt(
      "ERC721MarketplaceFacet",
      aavegotchiDiamondAddress
    )) as ERC721MarketplaceFacet;

    libItemsEvents = (await ethers.getContractAt(
      "LibItemsEvents",
      aavegotchiDiamondAddress
    )) as LibItemsEvents;

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

    //Unequip all previous wearables from test gotchis
    await itemsFacet.connect(grantee).equipWearables(gotchiId, emptyWearableIds);
    await itemsFacet.connect(grantee).equipWearables(anotherGotchiId, emptyWearableIds);
    await itemsFacet.connect(grantee).equipWearables(LargeGotchiOwnerAavegotchis[2], emptyWearableIds);
    await itemsFacet.connect(grantee).equipWearables(LargeGotchiOwnerAavegotchis[3], emptyWearableIds);
    });

  describe("equipDelegatedWearables", () => {
    let CommitmentCreated: Commitment;
    let GrantRoleData: GrantRoleData;
    let depositIdsCounter = 0;
    let itemdepositIds: Number[];
    let wearableIdsToEquip: Number[];

    beforeEach(async () => {
      itemdepositIds = new Array(16).fill(0);
      wearableIdsToEquip = new Array(16).fill(0);

      CommitmentCreated = buildCommitment({
        grantor: grantor.address,
        tokenAddress: wearableDiamondAddress,
        tokenId: wearableIds[3],
      });

      depositIdsCounter = Number((await ItemsRolesRegistryFacet.connect(grantor).callStatic.commitTokens(
        CommitmentCreated.grantor,
        CommitmentCreated.tokenAddress,
        CommitmentCreated.tokenId,
        CommitmentCreated.tokenAmount
      )).toString());
    
      GrantRoleData = await buildGrantRole({
        depositId: depositIdsCounter,
        grantee: granteeAddress,
      });

      await wearablesFacet
        .connect(grantor)
        .setApprovalForAll(ItemsRolesRegistryFacet.address, true);

      await ItemsRolesRegistryFacet.connect(grantor).commitTokens(
        CommitmentCreated.grantor,
        CommitmentCreated.tokenAddress,
        CommitmentCreated.tokenId,
        CommitmentCreated.tokenAmount
      );
      await ItemsRolesRegistryFacet.connect(grantor).grantRole(
        GrantRoleData.depositId,
        GrantRoleData.role,
        GrantRoleData.grantee,
        GrantRoleData.expirationDate,
        GrantRoleData.revocable,
        GrantRoleData.data
      );
    });

    it("should equip and unequip delegated wearable", async () => {
      itemdepositIds[3] = GrantRoleData.depositId;
      wearableIdsToEquip[3] = wearableIds[3];

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(gotchiId, wearableIdsToEquip, itemdepositIds)
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
            emptyItemdepositIds
          )
      )
        .to.emit(libERC1155, "TransferFromParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[3], 1)
        .to.not.emit(libEventHandler, "TransferSingle");
    });
    it("should unequip a delegated wearable when the role is revoked", async () => {
      itemdepositIds[3] = GrantRoleData.depositId;
      wearableIdsToEquip[3] = wearableIds[3];
      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(gotchiId, wearableIdsToEquip, itemdepositIds)
      )
        .to.emit(libERC1155, "TransferToParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[3], 1)
        .to.not.emit(libEventHandler, "TransferSingle");

      await expect(
        ItemsRolesRegistryFacet.connect(grantor).revokeRole(
          GrantRoleData.depositId,
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
        ++depositIdsCounter,
        wearableIds[0],
        2
      );
      // wearables[0] -> hands
      itemdepositIds[4] = newGrantRoleData.depositId;
      itemdepositIds[5] = newGrantRoleData.depositId;
      wearableIdsToEquip[4] = wearableIds[0];
      wearableIdsToEquip[5] = wearableIds[0];

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(gotchiId, wearableIdsToEquip, itemdepositIds)
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
            emptyItemdepositIds
          )
      )
        .to.emit(libERC1155, "TransferFromParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[0], 1)
        .to.emit(libERC1155, "TransferFromParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[0], 1)
        .to.not.emit(libEventHandler, "TransferSingle");
    });
    it("should equip and unequip mixed delegated and not delegated wearables", async () => {
      expect(await wearablesFacet
        .connect(grantor)
        .safeTransferFrom(
          grantor.address,
          LargeGotchiOwner,
          wearableIds[0],
          2,
          "0x"
        )).to.not.be.reverted;
      // wearables[0] -> hands
      // wearables[1] -> hat

      itemdepositIds[3] = GrantRoleData.depositId;
      wearableIdsToEquip[3] = wearableIds[3];
      wearableIdsToEquip[4] = wearableIds[0];
      wearableIdsToEquip[5] = wearableIds[0];

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(gotchiId, wearableIdsToEquip, itemdepositIds)
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
            emptyItemdepositIds
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
      const { GrantRoleData } = await createRoleAssignment(
        ++depositIdsCounter,
        wearableIds[1],
        2
      );

      itemdepositIds[2] = GrantRoleData.depositId;
      wearableIdsToEquip[2] = wearableIds[1];

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(gotchiId, wearableIdsToEquip, itemdepositIds)
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
            itemdepositIds
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
            itemdepositIds
          )
      ).to.be.revertedWith("ItemsFacet: Not enough delegated balance");

      await expect(
        ItemsRolesRegistryFacet.connect(grantor).revokeRole(
          GrantRoleData.depositId,
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
      itemdepositIds[3] = GrantRoleData.depositId;
      wearableIdsToEquip[3] = wearableIds[2];

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(gotchiId, wearableIdsToEquip, itemdepositIds)
      ).to.be.revertedWith(
        "ItemsFacet: Delegated Wearable not of this delegation"
      );
    });
    it("should NOT equip a delegated wearable if the grantee is invalid for respective depositId", async () => {
      const { GrantRoleData } = await createRoleAssignment(
        ++depositIdsCounter,
        wearableIds[2],
        1,
        anotherUser.address
      );

      itemdepositIds[3] = GrantRoleData.depositId;
      wearableIdsToEquip[3] = wearableIds[2];

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(gotchiId, wearableIdsToEquip, itemdepositIds)
      ).to.be.revertedWith(
        "ItemsFacet: Wearable not delegated to sender or depositId not valid"
      );
    });
    it("should NOT equip a delegated wearable if the depositId does not exist", async () => {
      await createRoleAssignment(++depositIdsCounter, wearableIds[2], 1);

      const wrongdepositId = generateRandomInt();
      itemdepositIds[3] = wrongdepositId;
      wearableIdsToEquip[3] = wearableIds[2];

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(gotchiId, wearableIdsToEquip, itemdepositIds)
      ).to.be.revertedWith(
        "ItemsFacet: Wearable not delegated to sender or depositId not valid"
      );
    });
    it("should NOT equip a delegated wearable if the wearable is all delegated balance is already equipped in other gotchi", async () => {
      itemdepositIds[3] = GrantRoleData.depositId;
      wearableIdsToEquip[3] = wearableIds[3];

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(gotchiId, wearableIdsToEquip, itemdepositIds)
      )
        .to.emit(libERC1155, "TransferToParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[3], 1)
        .to.not.emit(libEventHandler, "TransferSingle");

      
      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            anotherGotchiId,
            wearableIdsToEquip,
            itemdepositIds
          )
      ).to.be.revertedWith("ItemsFacet: Not enough delegated balance");

      // unequip for next test
      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            emptyWearableIds,
            emptyItemdepositIds
          )
      )
        .to.emit(libERC1155, "TransferFromParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[3], 1)
        .to.not.emit(libEventHandler, "TransferSingle");
    });
    it("should NOT equip a delegated wearable if sender doesn't enough delegated balance", async function () {
      const { GrantRoleData: newGrantRoleData } = await createRoleAssignment(
        ++depositIdsCounter,
        wearableIds[0],
        1
      );

      itemdepositIds[4] = newGrantRoleData.depositId;
      itemdepositIds[5] = newGrantRoleData.depositId;
      wearableIdsToEquip[4] = wearableIds[0];
      wearableIdsToEquip[5] = wearableIds[0];

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(gotchiId, wearableIdsToEquip, itemdepositIds)
      ).to.be.revertedWith("ItemsFacet: Not enough delegated balance");
    });
    it("should equip delegated wearables in two gotchis with the same depositId and unequip all with withdraw", async () => {
      const { GrantRoleData } = await createRoleAssignment(
        ++depositIdsCounter,
        wearableIds[1],
        2
      );

      itemdepositIds[2] = GrantRoleData.depositId
      wearableIdsToEquip[2] = wearableIds[1]

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(gotchiId, wearableIdsToEquip, itemdepositIds)
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
            itemdepositIds
          )
      )
        .to.emit(libERC1155, "TransferToParent")
        .withArgs(aavegotchiDiamondAddress, anotherGotchiId, wearableIds[1], 1)
        .to.emit(libItemsEvents, "EquipWearables")
        .withArgs(
          anotherGotchiId,
          emptyWearableIds,
          wearableIdsToEquip,
        ).to.emit(libItemsEvents, "EquipDelegatedWearables")
        .withArgs(
          anotherGotchiId,
          emptyItemdepositIds,
          itemdepositIds,
        ).to.not.emit(libEventHandler, "TransferSingle");

      await expect(
        ItemsRolesRegistryFacet.connect(grantor).releaseTokens(
          GrantRoleData.depositId
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
        )
        .to.emit(libItemsEvents, "EquipWearables")
        .withArgs(
          gotchiId,
          wearableIdsToEquip,
          emptyWearableIds,
        )
        .to.emit(libItemsEvents, "EquipWearables")
        .withArgs(
          anotherGotchiId,
          wearableIdsToEquip,
          emptyWearableIds,
        )
        .to.emit(libItemsEvents, "EquipDelegatedWearables")
        .withArgs(
          gotchiId,
          itemdepositIds,
          emptyItemdepositIds,
        )
        .to.emit(libItemsEvents, "EquipDelegatedWearables")
        .withArgs(
          anotherGotchiId,
          itemdepositIds,
          emptyItemdepositIds,
        );
    });
    describe("edge cases", () => {
      it("should NOT transfer an aavegotchi with delegated wearable equipped", async () => {
        

        itemdepositIds[3] = GrantRoleData.depositId
        wearableIdsToEquip[3] = wearableIds[3]

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              wearableIdsToEquip,
              itemdepositIds
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
              emptyItemdepositIds
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
      it('should NOT create a ERC721 listing for an aavegotchi with delegated wearable equipped', async () => {
        

        itemdepositIds[3] = GrantRoleData.depositId
        wearableIdsToEquip[3] = wearableIds[3]

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              wearableIdsToEquip,
              itemdepositIds
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
          ERC721MarketplaceFacet
            .connect(grantee)
            .addERC721Listing(
              aavegotchiDiamondAddress,
              anotherGotchiId,
              "1",
            )
        ).to.be.revertedWith(
          "ERC721Marketplace: Only callable on Aavegotchis with no delegated wearables equipped"
        );

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              emptyWearableIds,
              emptyItemdepositIds
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
      })
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
          ++depositIdsCounter,
          wearableIds[0],
          1
        );

        

        itemdepositIds[5] = newGrantRoleData1.depositId;
        wearableIdsToEquip[5] = wearableIds[0];
        wearableIdsToEquip[4] = wearableIds[0];

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              wearableIdsToEquip,
              itemdepositIds
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
              emptyItemdepositIds
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
          ++depositIdsCounter,
          wearableIds[0],
          1
        );

        

        itemdepositIds[5] = newGrantRoleData1.depositId
        wearableIdsToEquip[5] = wearableIds[0];
        wearableIdsToEquip[4] = wearableIds[0];
         
        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              wearableIdsToEquip,
              itemdepositIds
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
        itemdepositIds[4] = 0;

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              [0, 0, 0, 0, wearableIds[0], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              itemdepositIds
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
              emptyItemdepositIds
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
      it("should equip two gloves one both delegated and unequip the right hand first and then the left with revokeRole", async () => {
        const { GrantRoleData: newGrantRoleData1 } = await createRoleAssignment(++depositIdsCounter, wearableIds[0], 2);

        

        itemdepositIds[4] = newGrantRoleData1.depositId
        itemdepositIds[5] = newGrantRoleData1.depositId
        wearableIdsToEquip[4] = wearableIds[0];
        wearableIdsToEquip[5] = wearableIds[0];

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              wearableIdsToEquip,
              itemdepositIds
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

        itemdepositIds[5] = 0
        wearableIdsToEquip[5] = 0;

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              wearableIdsToEquip,
              itemdepositIds
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
          ItemsRolesRegistryFacet.connect(grantor).revokeRole(
            newGrantRoleData1.depositId,
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
          ).to.emit(libItemsEvents, "EquipWearables")
          .withArgs(
            anotherGotchiId,
            wearableIdsToEquip,
            emptyWearableIds,
          )
          .to.emit(libItemsEvents, "EquipDelegatedWearables")
          .withArgs(
            anotherGotchiId,
            itemdepositIds,
            emptyItemdepositIds,
          );
      });
      it("should equip and unequip with revokeRole two gloves of the same id, but different depositId", async () => {
        const { GrantRoleData: newGrantRoleData1 } = await createRoleAssignment(++depositIdsCounter, wearableIds[0], 1);
        const { GrantRoleData: newGrantRoleData2 } = await createRoleAssignment(++depositIdsCounter, wearableIds[0], 1);

        itemdepositIds[4] = newGrantRoleData1.depositId
        itemdepositIds[5] = newGrantRoleData2.depositId
        wearableIdsToEquip[4] = wearableIds[0];
        wearableIdsToEquip[5] = wearableIds[0];

        let oldWearableIdsToEquip = [...wearableIdsToEquip];
        let oldItemdepositIds = [...itemdepositIds];

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              wearableIdsToEquip,
              itemdepositIds
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

        itemdepositIds[4] = 0
        wearableIdsToEquip[4] = 0;

        await expect(
          ItemsRolesRegistryFacet.connect(grantor).revokeRole(
            newGrantRoleData1.depositId,
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
          ).to.emit(libItemsEvents, "EquipWearables")
          .withArgs(
            anotherGotchiId,
            oldWearableIdsToEquip,
            wearableIdsToEquip,
          )
          .to.emit(libItemsEvents, "EquipDelegatedWearables")
          .withArgs(
            anotherGotchiId,
            oldItemdepositIds,
            itemdepositIds,
          );

        oldItemdepositIds[4] = 0
        oldWearableIdsToEquip[4] = 0;

        await expect(
          ItemsRolesRegistryFacet.connect(grantor).revokeRole(
            newGrantRoleData2.depositId,
            newGrantRoleData2.role,
            newGrantRoleData2.grantee,
          )
        )
          .to.emit(libERC1155, "TransferFromParent")
          .withArgs(
            aavegotchiDiamondAddress,
            anotherGotchiId,
            wearableIds[0],
            1
          ).to.emit(libItemsEvents, "EquipWearables")
          .withArgs(
            anotherGotchiId,
            oldWearableIdsToEquip,
            emptyWearableIds,
          )
          .to.emit(libItemsEvents, "EquipDelegatedWearables")
          .withArgs(
            anotherGotchiId,
            oldItemdepositIds,
            emptyItemdepositIds,
          );
      })
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
        
        const { GrantRoleData: newGrantRoleData1 } = await createRoleAssignment(++depositIdsCounter, wearableIds[1], 1);
        const { GrantRoleData: newGrantRoleData2 } = await createRoleAssignment(++depositIdsCounter, wearableIds[5], 1);


        const anotherGotchiId = LargeGotchiOwnerAavegotchis[3];

        itemdepositIds[2] = newGrantRoleData1.depositId,
        itemdepositIds[3] = GrantRoleData.depositId,
        itemdepositIds[6] = newGrantRoleData2.depositId,
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
              itemdepositIds
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
        itemdepositIds[2] = 0
        itemdepositIds[3] = 0
        wearableIdsToEquip[2] = 0;
        wearableIdsToEquip[3] = 0;

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              wearableIdsToEquip,
              itemdepositIds
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
              itemdepositIds
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
        itemdepositIds[6] = 0
        wearableIdsToEquip[6] = 0;

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              wearableIdsToEquip,
              itemdepositIds
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

        const { GrantRoleData: newGrantRoleData1 } = await createRoleAssignment(++depositIdsCounter, wearableIds[0], 2);
        


        itemdepositIds[5] = newGrantRoleData1.depositId,
        wearableIdsToEquip[5] = wearableIds[0];
        wearableIdsToEquip[4] = wearableIds[0];
         
        
        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              wearableIdsToEquip,
              itemdepositIds
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

        itemdepositIds[4] = newGrantRoleData1.depositId,

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              wearableIdsToEquip,
              itemdepositIds
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

        const { GrantRoleData: newGrantRoleData1 } = await createRoleAssignment(++depositIdsCounter, wearableIds[0], 2);
        const { GrantRoleData: newGrantRoleData2 } = await createRoleAssignment(++depositIdsCounter, wearableIds[0], 2);

        const anotherGotchiId = LargeGotchiOwnerAavegotchis[2];

        itemdepositIds[4] = newGrantRoleData1.depositId
        itemdepositIds[5] = newGrantRoleData1.depositId
        wearableIdsToEquip[4] = wearableIds[0];
        wearableIdsToEquip[5] = wearableIds[0];
         

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              wearableIdsToEquip,
              itemdepositIds
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

        itemdepositIds[5] = newGrantRoleData2.depositId,

        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              anotherGotchiId,
              wearableIdsToEquip,
              itemdepositIds
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
       
        itemdepositIds[3] = GrantRoleData.depositId
        wearableIdsToEquip[3] = wearableIds[3];
         
        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              gotchiId,
              wearableIdsToEquip,
              itemdepositIds
            )
        ).to.be.revertedWith("ItemsFacet: Wearable delegation expired");
      });
      it("should unequip a delegated wearable when a revocable delegation is granted to another grantee", async () => {
        const grantee2 = (await ethers.getSigners())[3];
        const grantee2Gotchi = LargeGotchiOwnerAavegotchis[4];
        await aavegotchiFacet.connect(grantee).transferFrom(granteeAddress, grantee2.address, grantee2Gotchi);

        itemdepositIds[3] = GrantRoleData.depositId
        wearableIdsToEquip[3] = wearableIds[3];
         
        await expect(
          itemsFacet
            .connect(grantee)
            .equipDelegatedWearables(
              gotchiId,
              wearableIdsToEquip,
              itemdepositIds
            ))
            .to.emit(libERC1155, "TransferToParent")
            .withArgs(
              aavegotchiDiamondAddress,
              gotchiId,
              wearableIds[3],
              1
            )

        await ItemsRolesRegistryFacet.connect(grantor).grantRole(
          depositIdsCounter,
          GrantRoleData.role,
          grantee2.address,
          GrantRoleData.expirationDate,
          GrantRoleData.revocable,
          GrantRoleData.data
        );

        await expect(
          itemsFacet
            .connect(grantee2)
            .equipDelegatedWearables(
              grantee2Gotchi,
              wearableIdsToEquip,
              itemdepositIds
            ))
            .to.emit(libERC1155, "TransferToParent")
            .withArgs(
              aavegotchiDiamondAddress,
              grantee2Gotchi,
              wearableIds[3],
              1
            )
      });
      it("should unequip and equip a wearable background 210 from aavegotchi 4160 but not transfer it", async () => {

        const specificGotchiOwnerAddress = "0xAd0CEb6Dc055477b8a737B630D6210EFa76a2265"
        const specificGotchiId = 4160
        const wearableId = 210

        await network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [specificGotchiOwnerAddress],
        });

        const specificGotchiOwner = await ethers.provider.getSigner(specificGotchiOwnerAddress);
        let oldEquippedWearables = Array(16).fill(0)
        oldEquippedWearables[7] = wearableId
        await expect(
          itemsFacet
            .connect(specificGotchiOwner)
            .equipDelegatedWearables(
              specificGotchiId,
              emptyWearableIds,
              emptyItemdepositIds
            ))
            .to.emit(libItemsEvents, "EquipWearables")
            .withArgs(
              specificGotchiId,
              oldEquippedWearables,
              emptyWearableIds,
            )
            .to.not.emit(libERC1155, "TransferFromParent")
            .to.not.emit(libEventHandler, "TransferSingle");

          const balance = await wearablesFacet.balanceOf(specificGotchiOwnerAddress, wearableId)
          expect(balance).to.equal(0)

          const aavegotchiBefore = await aavegotchiFacet.getAavegotchi(specificGotchiId)
          expect(aavegotchiBefore.equippedWearables[7]).to.be.equal(0)

          await expect(
            itemsFacet
              .connect(specificGotchiOwner)
              .equipDelegatedWearables(
                specificGotchiId,
                oldEquippedWearables,
                emptyItemdepositIds
              ))
              .to.emit(libItemsEvents, "EquipWearables")
              .withArgs(
                specificGotchiId,
                emptyWearableIds,
                oldEquippedWearables,
              )
              .to.not.emit(libERC1155, "TransferToParent")
              .to.not.emit(libEventHandler, "TransferSingle");

          const aavegotchiAfter = await aavegotchiFacet.getAavegotchi(specificGotchiId)
          expect(aavegotchiAfter.equippedWearables[7]).to.be.equal(wearableId)
      })
    });
  });

  async function createRoleAssignment(
    depositId: number,
    tokenId: number,
    tokenAmount: number,
    grantee: string = granteeAddress
  ) {
    const CommitmentCreated = buildCommitment({
      grantor: grantor.address,
      tokenId,
      tokenAmount,
    });
    const GrantRoleData = await buildGrantRole({
      depositId,
      grantee,
    });

    await ItemsRolesRegistryFacet.connect(grantor).commitTokens(
      CommitmentCreated.grantor,
      CommitmentCreated.tokenAddress,
      CommitmentCreated.tokenId,
      CommitmentCreated.tokenAmount
    );
    // wearables[0] -> hands
    await ItemsRolesRegistryFacet.connect(grantor).grantRole(
      GrantRoleData.depositId,
      GrantRoleData.role,
      GrantRoleData.grantee,
      GrantRoleData.expirationDate,
      GrantRoleData.revocable,
      GrantRoleData.data
    );
    return { GrantRoleData, CommitmentCreated };
  }
});
