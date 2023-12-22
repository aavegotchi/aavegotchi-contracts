/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
import { DAOFacet, DiamondLoupeFacet, LibEventHandler, WearablesFacet } from "../../typechain";

import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  aavegotchiDiamondAddress,
  generateRandomInt,
  time,
  wearableDiamondAddress,
  wearableIds,
  generateRoleId,
  buildRecord,
  buildGrantRole,
} from "./helpers";
import { itemManagerAlt } from "../../scripts/helperFunctions";
import { upgradeWithNewFacets } from "./upgradeScript";
import { GrantRoleData, Record } from "./types";

const { expect } = chai;

describe("ItemsRolesRegistryFacet", async () => {
  let ItemsRolesRegistryFacet: Contract;
  let grantor: SignerWithAddress;
  let grantee: SignerWithAddress;
  let anotherUser: SignerWithAddress;
  let wearablesFacet: WearablesFacet;
  let libEventHandler: LibEventHandler;
  let daoFacet: DAOFacet;
  let recordIdsCounter = 0;

  before(async () => {
    const signers = await ethers.getSigners();
    grantor = signers[0];
    grantee = signers[1];
    anotherUser = signers[2];

    const diamondOwnerAddress = "0x01F010a5e001fe9d6940758EA5e8c777885E351e";
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [diamondOwnerAddress],
    });
    const diamondOwner = await ethers.provider.getSigner(diamondOwnerAddress);

    await upgradeWithNewFacets({
      diamondAddress: aavegotchiDiamondAddress,
      facetNames: ["ItemsRolesRegistryFacet", "DiamondLoupeFacet"],
      signer: diamondOwner,
      initFacetName: "InitItemsRolesRegistryFacet",
      initArgs: [],
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

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManagerAlt],
    });
    const signer = await ethers.provider.getSigner(itemManagerAlt);

    daoFacet = (
      await ethers.getContractAt("DAOFacet", aavegotchiDiamondAddress)
    ).connect(signer);

    await daoFacet.updateItemTypeMaxQuantity(wearableIds, wearableIds.map(() => 2000));
    await daoFacet.mintItems(
      grantor.address,
      wearableIds,
      wearableIds.map(() => 1000)
    );
  });

  describe('createRecordFrom', async () => {
    it('should revert when sender is not grantor or approved', async () => {
      const record = buildRecord({grantor: grantor.address})
      await expect(
        ItemsRolesRegistryFacet.connect(anotherUser).createRecordFrom(
          record.grantor,
          record.tokenAddress,
          record.tokenId,
          record.tokenAmount,
        ),
      ).to.be.revertedWith('ItemsRolesRegistryFacet: account not approved')
    })

    it('should revert when tokenAmount is zero', async () => {
      const record = buildRecord({
        grantor: grantor.address,
        tokenAddress: wearableDiamondAddress,
        tokenAmount: 0,
      })
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).createRecordFrom(
          record.grantor,
          record.tokenAddress,
          record.tokenId,
          record.tokenAmount,
        ),
      ).to.be.revertedWith('ItemsRolesRegistryFacet: tokenAmount must be greater than zero')
    })

    it('should revert without a reason if tokenAddress is not an ERC-1155 contract', async () => {
      const record = buildRecord({
        grantor: grantor.address,
        tokenAmount: generateRandomInt(),
      })
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).createRecordFrom(
          record.grantor,
          record.tokenAddress,
          record.tokenId,
          record.tokenAmount,
        ),
      ).to.be.reverted
    })

    it('should revert when grantor does not have enough tokens', async () => {
      const record = buildRecord({
        grantor: grantor.address,
        tokenAddress: wearableDiamondAddress,
        tokenAmount: generateRandomInt() + 1,
      })
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).createRecordFrom(
          record.grantor,
          record.tokenAddress,
          record.tokenId,
          record.tokenAmount,
        ),
      ).to.be.revertedWith("LibItems: Doesn't have that many to transfer")
    })

    it('should create record when sender is grantor', async () => {
      const record = buildRecord({grantor: grantor.address})
      recordIdsCounter++
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).createRecordFrom(
          record.grantor,
          record.tokenAddress,
          record.tokenId,
          record.tokenAmount,
        ),
      )
        .to.emit(ItemsRolesRegistryFacet, 'RecordCreated')
        .withArgs(record.grantor, recordIdsCounter, record.tokenAddress, record.tokenId, record.tokenAmount)
        .to.emit(libEventHandler, 'TransferSingle')
        .withArgs(
          grantor.address,
          grantor.address,
          aavegotchiDiamondAddress,
          record.tokenId,
          record.tokenAmount,
        )
    })

    it('should create record when sender is approved', async () => {
      const record = buildRecord({
        grantor: grantor.address,
        tokenAddress: wearableDiamondAddress,
      })
      recordIdsCounter++
      await ItemsRolesRegistryFacet.connect(grantor).setRoleApprovalForAll(record.tokenAddress, anotherUser.address, true)
      await expect(
        ItemsRolesRegistryFacet.connect(anotherUser).createRecordFrom(
          record.grantor,
          record.tokenAddress,
          record.tokenId,
          record.tokenAmount,
        ),
      )
        .to.emit(ItemsRolesRegistryFacet, 'RecordCreated')
        .withArgs(record.grantor, recordIdsCounter, record.tokenAddress, record.tokenId, record.tokenAmount)
        .to.emit(libEventHandler, 'TransferSingle')
        .withArgs(
          anotherUser.address,
          record.grantor,
          aavegotchiDiamondAddress,
          record.tokenId,
          record.tokenAmount,
        )
    })
  })

  describe('grantRole', async () => {
    let RecordCreated: Record
    let GrantRoleData: GrantRoleData

    beforeEach(async () => {
      RecordCreated = buildRecord({
        grantor: grantor.address,
        tokenAddress: wearableDiamondAddress,
      })
      recordIdsCounter++
      GrantRoleData = await buildGrantRole({
        recordId: recordIdsCounter,
        grantee: grantee.address,
      })
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).createRecordFrom(
          RecordCreated.grantor,
          RecordCreated.tokenAddress,
          RecordCreated.tokenId,
          RecordCreated.tokenAmount,
        ),
      ).to.not.be.reverted
    })

    it('should revert when sender is not grantor or approved', async () => {
      await ItemsRolesRegistryFacet.connect(grantor).setRoleApprovalForAll(
        RecordCreated.tokenAddress,
        anotherUser.address,
        false,
      )
      await expect(
        ItemsRolesRegistryFacet.connect(anotherUser).grantRole(
          GrantRoleData.recordId,
          GrantRoleData.role,
          GrantRoleData.grantee,
          GrantRoleData.expirationDate,
          GrantRoleData.revocable,
          GrantRoleData.data,
        ),
      ).to.be.revertedWith('ItemsRolesRegistryFacet: account not approved')
    })

    it('should revert when role is not supported', async () => {
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRole(
          GrantRoleData.recordId,
          generateRoleId('ANOTHER_ROLE'),
          GrantRoleData.grantee,
          GrantRoleData.expirationDate,
          GrantRoleData.revocable,
          GrantRoleData.data,
        ),
      ).to.be.revertedWith('ItemsRolesRegistryFacet: role not supported')
    })

    it('should revert when expirationDate is zero', async () => {
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRole(
          GrantRoleData.recordId,
          GrantRoleData.role,
          GrantRoleData.grantee,
          await time.latest(),
          GrantRoleData.revocable,
          GrantRoleData.data,
        ),
      ).to.be.revertedWith('ItemsRolesRegistryFacet: invalid expiration date')
    })

    it('should grant role when sender is grantor', async () => {
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRole(
          GrantRoleData.recordId,
          GrantRoleData.role,
          GrantRoleData.grantee,
          GrantRoleData.expirationDate,
          GrantRoleData.revocable,
          GrantRoleData.data,
        ),
      )
        .to.emit(ItemsRolesRegistryFacet, 'RoleGranted')
        .withArgs(
          GrantRoleData.recordId,
          GrantRoleData.role,
          GrantRoleData.grantee,
          GrantRoleData.expirationDate,
          GrantRoleData.revocable,
          GrantRoleData.data,
        )
    })

    it('should grant role when sender is approved', async () => {
      await ItemsRolesRegistryFacet.connect(grantor).setRoleApprovalForAll(
        RecordCreated.tokenAddress,
        anotherUser.address,
        true,
      )
      await expect(
        ItemsRolesRegistryFacet.connect(anotherUser).grantRole(
          GrantRoleData.recordId,
          GrantRoleData.role,
          GrantRoleData.grantee,
          GrantRoleData.expirationDate,
          GrantRoleData.revocable,
          GrantRoleData.data,
        ),
      )
        .to.emit(ItemsRolesRegistryFacet, 'RoleGranted')
        .withArgs(
          GrantRoleData.recordId,
          GrantRoleData.role,
          GrantRoleData.grantee,
          GrantRoleData.expirationDate,
          GrantRoleData.revocable,
          GrantRoleData.data,
        )
    })
  })

  describe('revokeRole', async () => {
    let RecordCreated: Record
    let GrantRoleData: GrantRoleData

    beforeEach(async () => {
      RecordCreated = buildRecord({
        grantor: grantor.address,
        tokenAddress: wearableDiamondAddress,
      })
      recordIdsCounter++
      GrantRoleData = await buildGrantRole({
        recordId: recordIdsCounter,
        grantee: grantee.address,
      })
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).createRecordFrom(
          RecordCreated.grantor,
          RecordCreated.tokenAddress,
          RecordCreated.tokenId,
          RecordCreated.tokenAmount,
        ),
      ).to.not.be.reverted
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRole(
          GrantRoleData.recordId,
          GrantRoleData.role,
          GrantRoleData.grantee,
          GrantRoleData.expirationDate,
          GrantRoleData.revocable,
          GrantRoleData.data,
        ),
      ).to.not.be.reverted
    })

    it('should revert when sender is not grantor or approved', async () => {
      await ItemsRolesRegistryFacet.connect(grantor).setRoleApprovalForAll(
        RecordCreated.tokenAddress,
        anotherUser.address,
        false,
      )
      await expect(
        ItemsRolesRegistryFacet.connect(anotherUser).revokeRoleFrom(
          GrantRoleData.recordId,
          GrantRoleData.role,
          grantee.address,
        ),
      ).to.be.revertedWith('ItemsRolesRegistryFacet: sender must be approved')
    })

    it('should revert when the grantee is not the same', async () => {
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).revokeRoleFrom(
          GrantRoleData.recordId,
          GrantRoleData.role,
          anotherUser.address,
        ),
      ).to.be.revertedWith('ItemsRolesRegistryFacet: grantee mismatch')
    })

    it('should revert when role is not expired and is not revocable', async () => {
      const newRecordId = 2
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).createRecordFrom(
          RecordCreated.grantor,
          RecordCreated.tokenAddress,
          RecordCreated.tokenId,
          RecordCreated.tokenAmount,
        ),
      ).to.not.be.reverted
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRole(
          newRecordId,
          GrantRoleData.role,
          GrantRoleData.grantee,
          GrantRoleData.expirationDate,
          false,
          GrantRoleData.data,
        ),
      ).to.not.be.reverted
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).revokeRoleFrom(newRecordId, GrantRoleData.role, GrantRoleData.grantee),
      ).to.be.revertedWith('ItemsRolesRegistryFacet: role is not expired and is not revocable')
    })

    it('should revoke role when sender is grantee, and role is not expired nor revocable', async () => {
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRole(
          GrantRoleData.recordId,
          GrantRoleData.role,
          GrantRoleData.grantee,
          GrantRoleData.expirationDate,
          false,
          GrantRoleData.data,
        ),
      ).to.not.be.reverted

      await expect(
        ItemsRolesRegistryFacet.connect(grantee).revokeRoleFrom(
          GrantRoleData.recordId,
          GrantRoleData.role,
          GrantRoleData.grantee,
        ),
      )
        .to.emit(ItemsRolesRegistryFacet, 'RoleRevoked')
        .withArgs(GrantRoleData.recordId, GrantRoleData.role, GrantRoleData.grantee)
    })

    it('should revoke role when sender is grantor', async () => {
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).revokeRoleFrom(
          GrantRoleData.recordId,
          GrantRoleData.role,
          GrantRoleData.grantee,
        ),
      )
        .to.emit(ItemsRolesRegistryFacet, 'RoleRevoked')
        .withArgs(GrantRoleData.recordId, GrantRoleData.role, GrantRoleData.grantee)
    })

    it('should revoke role when sender is grantee', async () => {
      await expect(
        ItemsRolesRegistryFacet.connect(grantee).revokeRoleFrom(
          GrantRoleData.recordId,
          GrantRoleData.role,
          GrantRoleData.grantee,
        ),
      )
        .to.emit(ItemsRolesRegistryFacet, 'RoleRevoked')
        .withArgs(GrantRoleData.recordId, GrantRoleData.role, GrantRoleData.grantee)
    })

    it('should revoke role when sender is approved by grantor', async () => {
      await ItemsRolesRegistryFacet.connect(grantor).setRoleApprovalForAll(
        RecordCreated.tokenAddress,
        anotherUser.address,
        true,
      )
      await expect(
        ItemsRolesRegistryFacet.connect(anotherUser).revokeRoleFrom(
          GrantRoleData.recordId,
          GrantRoleData.role,
          GrantRoleData.grantee,
        ),
      )
        .to.emit(ItemsRolesRegistryFacet, 'RoleRevoked')
        .withArgs(GrantRoleData.recordId, GrantRoleData.role, GrantRoleData.grantee)
    })

    it('should revoke role when sender is approved by grantee', async () => {
      await ItemsRolesRegistryFacet.connect(grantee).setRoleApprovalForAll(
        RecordCreated.tokenAddress,
        anotherUser.address,
        true,
      )
      await expect(
        ItemsRolesRegistryFacet.connect(anotherUser).revokeRoleFrom(
          GrantRoleData.recordId,
          GrantRoleData.role,
          GrantRoleData.grantee,
        ),
      )
        .to.emit(ItemsRolesRegistryFacet, 'RoleRevoked')
        .withArgs(GrantRoleData.recordId, GrantRoleData.role, GrantRoleData.grantee)
    })
  })

  describe('withdrawFrom', async () => {
    let RecordCreated: Record
    let GrantRoleData: GrantRoleData

    beforeEach(async () => {
      RecordCreated = buildRecord({
        grantor: grantor.address,
        tokenAddress: wearableDiamondAddress,
      })
      recordIdsCounter++
      GrantRoleData = await buildGrantRole({
        recordId: recordIdsCounter,
        grantee: grantee.address,
        revocable: false,
      })
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).createRecordFrom(
          RecordCreated.grantor,
          RecordCreated.tokenAddress,
          RecordCreated.tokenId,
          RecordCreated.tokenAmount,
        ),
      ).to.not.be.reverted
    })

    it('should revert when sender is not grantor or approved', async () => {
      await ItemsRolesRegistryFacet.connect(grantor).setRoleApprovalForAll(
        RecordCreated.tokenAddress,
        anotherUser.address,
        false,
      )
      await expect(ItemsRolesRegistryFacet.connect(anotherUser).withdrawFrom(GrantRoleData.recordId)).to.be.revertedWith(
        'ItemsRolesRegistryFacet: account not approved',
      )
    })

    it('should revert when record has an active role', async () => {
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRole(
          GrantRoleData.recordId,
          GrantRoleData.role,
          GrantRoleData.grantee,
          GrantRoleData.expirationDate,
          GrantRoleData.revocable,
          GrantRoleData.data,
        ),
      ).to.not.be.reverted
      await expect(ItemsRolesRegistryFacet.connect(grantor).withdrawFrom(GrantRoleData.recordId)).to.be.revertedWith(
        'ItemsRolesRegistryFacet: token has an active role',
      )
    })

    it('should withdraw tokens when sender is grantor', async () => {
      await expect(ItemsRolesRegistryFacet.connect(grantor).withdrawFrom(GrantRoleData.recordId))
        .to.emit(ItemsRolesRegistryFacet, 'Withdrew')
        .withArgs(GrantRoleData.recordId)
        .to.emit(libEventHandler, 'TransferSingle')
        .withArgs(
          grantor.address,
          aavegotchiDiamondAddress,
          grantor.address,
          RecordCreated.tokenId,
          RecordCreated.tokenAmount,
        )
    })

    it('should withdraw tokens when sender is approved', async () => {
      await ItemsRolesRegistryFacet.connect(grantor).setRoleApprovalForAll(
        RecordCreated.tokenAddress,
        anotherUser.address,
        true,
      )
      await expect(ItemsRolesRegistryFacet.connect(anotherUser).withdrawFrom(GrantRoleData.recordId))
        .to.emit(ItemsRolesRegistryFacet, 'Withdrew')
        .withArgs(GrantRoleData.recordId)
        .to.emit(libEventHandler, 'TransferSingle')
        .withArgs(
          anotherUser.address,
          aavegotchiDiamondAddress,
          grantor.address,
          RecordCreated.tokenId,
          RecordCreated.tokenAmount,
        )
    })
  })

  describe('view functions', async () => {
    let RecordCreated: Record
    let GrantRoleData: GrantRoleData

    beforeEach(async () => {
      RecordCreated = buildRecord({grantor: grantor.address})
      recordIdsCounter++
      GrantRoleData = await buildGrantRole({
        recordId: recordIdsCounter,
        grantee: grantee.address,
      })
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).createRecordFrom(
          RecordCreated.grantor,
          RecordCreated.tokenAddress,
          RecordCreated.tokenId,
          RecordCreated.tokenAmount,
        ),
      ).to.not.be.reverted
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRole(
          GrantRoleData.recordId,
          GrantRoleData.role,
          GrantRoleData.grantee,
          GrantRoleData.expirationDate,
          GrantRoleData.revocable,
          GrantRoleData.data,
        ),
      ).to.not.be.reverted
    })

    it('should revert when grantee is not the same', async () => {
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).roleData(GrantRoleData.recordId, GrantRoleData.role, anotherUser.address),
      ).to.be.revertedWith('ItemsRolesRegistryFacet: grantee mismatch')
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).roleExpirationDate(
          GrantRoleData.recordId,
          GrantRoleData.role,
          anotherUser.address,
        ),
      ).to.be.revertedWith('ItemsRolesRegistryFacet: grantee mismatch')
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).isRoleRevocable(
          GrantRoleData.recordId,
          GrantRoleData.role,
          anotherUser.address,
        ),
      ).to.be.revertedWith('ItemsRolesRegistryFacet: grantee mismatch')
    })

    it('should return role data', async () => {
      expect(
        await ItemsRolesRegistryFacet.connect(grantor).roleExpirationDate(
          GrantRoleData.recordId,
          GrantRoleData.role,
          GrantRoleData.grantee,
        ),
      ).to.be.equal(GrantRoleData.expirationDate)

      expect(
        await ItemsRolesRegistryFacet.connect(grantor).roleData(
          GrantRoleData.recordId,
          GrantRoleData.role,
          GrantRoleData.grantee,
        ),
      ).to.be.equal(GrantRoleData.data)

      expect(
        await ItemsRolesRegistryFacet.connect(grantor).isRoleRevocable(
          GrantRoleData.recordId,
          GrantRoleData.role,
          GrantRoleData.grantee,
        ),
      ).to.be.equal(GrantRoleData.revocable)
    })
  })

  describe('ERC-165 supportsInterface', async () => {
    it('should return true if ERC1155Receiver interface id', async () => {
      expect(await ItemsRolesRegistryFacet.supportsInterface('0x4e2312e0')).to.be.true
    })

    it('should return true if IItemsRolesRegistryFacet interface id', async () => {
      expect(await ItemsRolesRegistryFacet.supportsInterface('0x42ba720c')).to.be.true
    })
  })

});
