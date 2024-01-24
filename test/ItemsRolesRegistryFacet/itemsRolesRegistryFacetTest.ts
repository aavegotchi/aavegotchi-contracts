/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
import { DAOFacet, LibEventHandler, WearablesFacet } from "../../typechain";

import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  aavegotchiDiamondAddress,
  generateRandomInt,
  time,
  wearableDiamondAddress,
  wearableIds,
  generateRoleId,
  buildCommitment,
  buildGrantRole,
  ONE_DAY,
} from "./helpers";
import { itemManagerAlt } from "../../scripts/helperFunctions";
import { GrantRoleData, Commitment } from "./types";
import { deployItemsRolesRegistryFacet } from "./deployTest";

const { expect } = chai;

describe("ItemsRolesRegistryFacet", async () => {
  let ItemsRolesRegistryFacet: Contract;
  let grantor: SignerWithAddress;
  let grantee: SignerWithAddress;
  let anotherUser: SignerWithAddress;
  let wearablesFacet: WearablesFacet;
  let libEventHandler: LibEventHandler;
  let daoFacet: DAOFacet;
  let depositIdsCounter = 0;

  before(async () => {
    const signers = await ethers.getSigners();
    grantor = signers[0];
    grantee = signers[1];
    anotherUser = signers[2];

    await deployItemsRolesRegistryFacet()

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

  describe('commitTokens', async () => {
    it('should revert when sender is not grantor or approved', async () => {
      const commitment = buildCommitment({grantor: grantor.address})
      await expect(
        ItemsRolesRegistryFacet.connect(anotherUser).commitTokens(
          commitment.grantor,
          commitment.tokenAddress,
          commitment.tokenId,
          commitment.tokenAmount,
        ),
      ).to.be.revertedWith('ItemsRolesRegistryFacet: account not approved')
    })

    it('should revert when tokenAmount is zero', async () => {
      const commitment = buildCommitment({
        grantor: grantor.address,
        tokenAddress: wearableDiamondAddress,
        tokenAmount: 0,
      })
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).commitTokens(
          commitment.grantor,
          commitment.tokenAddress,
          commitment.tokenId,
          commitment.tokenAmount,
        ),
      ).to.be.revertedWith('ItemsRolesRegistryFacet: tokenAmount must be greater than zero')
    })

    it('should revert without a reason if tokenAddress is not an ERC-1155 contract', async () => {
      const commitment = buildCommitment({
        grantor: grantor.address,
        tokenAmount: generateRandomInt(),
      })
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).commitTokens(
          commitment.grantor,
          commitment.tokenAddress,
          commitment.tokenId,
          commitment.tokenAmount,
        ),
      ).to.be.reverted
    })

    it('should revert when grantor does not have enough tokens', async () => {
      const commitment = buildCommitment({
        grantor: grantor.address,
        tokenAddress: wearableDiamondAddress,
        tokenAmount: generateRandomInt() + 1,
      })
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).commitTokens(
          commitment.grantor,
          commitment.tokenAddress,
          commitment.tokenId,
          commitment.tokenAmount,
        ),
      ).to.be.revertedWith("LibItems: Doesn't have that many to transfer")
    })

    it('should create commitment when sender is grantor', async () => {
      const commitment = buildCommitment({grantor: grantor.address})
      depositIdsCounter++
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).commitTokens(
          commitment.grantor,
          commitment.tokenAddress,
          commitment.tokenId,
          commitment.tokenAmount,
        ),
      )
        .to.emit(ItemsRolesRegistryFacet, 'TokensCommitted')
        .withArgs(commitment.grantor, depositIdsCounter, commitment.tokenAddress, commitment.tokenId, commitment.tokenAmount)
        .to.emit(libEventHandler, 'TransferSingle')
        .withArgs(
          grantor.address,
          grantor.address,
          aavegotchiDiamondAddress,
          commitment.tokenId,
          commitment.tokenAmount,
        )
    })

    it('should create commitment when sender is approved', async () => {
      const commitment = buildCommitment({
        grantor: grantor.address,
        tokenAddress: wearableDiamondAddress,
      })
      depositIdsCounter++
      await ItemsRolesRegistryFacet.connect(grantor).setRoleApprovalForAll(commitment.tokenAddress, anotherUser.address, true)
      await expect(
        ItemsRolesRegistryFacet.connect(anotherUser).commitTokens(
          commitment.grantor,
          commitment.tokenAddress,
          commitment.tokenId,
          commitment.tokenAmount,
        ),
      )
        .to.emit(ItemsRolesRegistryFacet, 'TokensCommitted')
        .withArgs(commitment.grantor, depositIdsCounter, commitment.tokenAddress, commitment.tokenId, commitment.tokenAmount)
        .to.emit(libEventHandler, 'TransferSingle')
        .withArgs(
          anotherUser.address,
          commitment.grantor,
          aavegotchiDiamondAddress,
          commitment.tokenId,
          commitment.tokenAmount,
        )
    })
  })

  describe('grantRole', async () => {
    let TokensCommitted: Commitment
    let GrantRoleData: GrantRoleData

    beforeEach(async () => {
      TokensCommitted = buildCommitment({
        grantor: grantor.address,
        tokenAddress: wearableDiamondAddress,
      })
      depositIdsCounter++
      GrantRoleData = await buildGrantRole({
        depositId: depositIdsCounter,
        grantee: grantee.address,
      })
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).commitTokens(
          TokensCommitted.grantor,
          TokensCommitted.tokenAddress,
          TokensCommitted.tokenId,
          TokensCommitted.tokenAmount,
        ),
      ).to.not.be.reverted
    })

    it('should revert when sender is not grantor or approved', async () => {
      await ItemsRolesRegistryFacet.connect(grantor).setRoleApprovalForAll(
        TokensCommitted.tokenAddress,
        anotherUser.address,
        false,
      )
      await expect(
        ItemsRolesRegistryFacet.connect(anotherUser).grantRole(
          GrantRoleData.depositId,
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
          GrantRoleData.depositId,
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
          GrantRoleData.depositId,
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
          GrantRoleData.depositId,
          GrantRoleData.role,
          GrantRoleData.grantee,
          GrantRoleData.expirationDate,
          GrantRoleData.revocable,
          GrantRoleData.data,
        ),
      )
        .to.emit(ItemsRolesRegistryFacet, 'RoleGranted')
        .withArgs(
          GrantRoleData.depositId,
          GrantRoleData.role,
          GrantRoleData.grantee,
          GrantRoleData.expirationDate,
          GrantRoleData.revocable,
          GrantRoleData.data,
        )
    })

    it('should grant role when sender is approved', async () => {
      await ItemsRolesRegistryFacet.connect(grantor).setRoleApprovalForAll(
        TokensCommitted.tokenAddress,
        anotherUser.address,
        true,
      )
      await expect(
        ItemsRolesRegistryFacet.connect(anotherUser).grantRole(
          GrantRoleData.depositId,
          GrantRoleData.role,
          GrantRoleData.grantee,
          GrantRoleData.expirationDate,
          GrantRoleData.revocable,
          GrantRoleData.data,
        ),
      )
        .to.emit(ItemsRolesRegistryFacet, 'RoleGranted')
        .withArgs(
          GrantRoleData.depositId,
          GrantRoleData.role,
          GrantRoleData.grantee,
          GrantRoleData.expirationDate,
          GrantRoleData.revocable,
          GrantRoleData.data,
        )
    })

    it('should revert when role is not revocable', async () => {
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).commitTokens(
          TokensCommitted.grantor,
          TokensCommitted.tokenAddress,
          TokensCommitted.tokenId,
          TokensCommitted.tokenAmount,
        ),
      ).to.not.be.reverted
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRole(
          ++depositIdsCounter,
          GrantRoleData.role,
          GrantRoleData.grantee,
          GrantRoleData.expirationDate,
          false,
          GrantRoleData.data,
        ),
      ).to.not.be.reverted
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRole(
          depositIdsCounter,
          GrantRoleData.role,
          GrantRoleData.grantee,
          GrantRoleData.expirationDate,
          false,
          GrantRoleData.data,
        ),
      ).to.be.revertedWith('ItemsRolesRegistryFacet: token has an active role')
    })
    
    it('should revert when role is expired', async () => {
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).commitTokens(
          TokensCommitted.grantor,
          TokensCommitted.tokenAddress,
          TokensCommitted.tokenId,
          TokensCommitted.tokenAmount,
        ),
      ).to.not.be.reverted
      depositIdsCounter++
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRole(
          depositIdsCounter,
          GrantRoleData.role,
          GrantRoleData.grantee,
          GrantRoleData.expirationDate,
          false,
          GrantRoleData.data,
        ),
      ).to.not.be.reverted
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRole(
          depositIdsCounter,
          GrantRoleData.role,
          GrantRoleData.grantee,
          GrantRoleData.expirationDate! + ONE_DAY,
          false,
          GrantRoleData.data,
        ),
      ).to.be.revertedWith('ItemsRolesRegistryFacet: token has an active role')
    })

    it('should revert if grantee is zero address', async () => {
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRole(
          GrantRoleData.depositId,
          GrantRoleData.role,
          ethers.constants.AddressZero,
          GrantRoleData.expirationDate,
          GrantRoleData.revocable,
          GrantRoleData.data,
        )).to.be.revertedWith('ItemsRolesRegistryFacet: grantee cannot be zero address')
    })
  })

  describe('revokeRole', async () => {
    let TokensCommitted: Commitment
    let GrantRoleData: GrantRoleData

    beforeEach(async () => {
      TokensCommitted = buildCommitment({
        grantor: grantor.address,
        tokenAddress: wearableDiamondAddress,
      })
      depositIdsCounter++
      GrantRoleData = await buildGrantRole({
        depositId: depositIdsCounter,
        grantee: grantee.address,
      })
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).commitTokens(
          TokensCommitted.grantor,
          TokensCommitted.tokenAddress,
          TokensCommitted.tokenId,
          TokensCommitted.tokenAmount,
        ),
      ).to.not.be.reverted
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRole(
          GrantRoleData.depositId,
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
        TokensCommitted.tokenAddress,
        anotherUser.address,
        false,
      )
      await expect(
        ItemsRolesRegistryFacet.connect(anotherUser).revokeRole(
          GrantRoleData.depositId,
          GrantRoleData.role,
          grantee.address,
        ),
      ).to.be.revertedWith('ItemsRolesRegistryFacet: sender must be approved')
    })

    it('should revert when the grantee is not the same', async () => {
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).revokeRole(
          GrantRoleData.depositId,
          GrantRoleData.role,
          anotherUser.address,
        ),
      ).to.be.revertedWith('ItemsRolesRegistryFacet: grantee mismatch')
    })

    it('should revert when role is not expired and is not revocable', async () => {
      const newdepositId = 2
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).commitTokens(
          TokensCommitted.grantor,
          TokensCommitted.tokenAddress,
          TokensCommitted.tokenId,
          TokensCommitted.tokenAmount,
        ),
      ).to.not.be.reverted
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRole(
          newdepositId,
          GrantRoleData.role,
          GrantRoleData.grantee,
          GrantRoleData.expirationDate,
          false,
          GrantRoleData.data,
        ),
      ).to.not.be.reverted
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).revokeRole(newdepositId, GrantRoleData.role, GrantRoleData.grantee),
      ).to.be.revertedWith('ItemsRolesRegistryFacet: role is not expired and is not revocable')
    })

    it('should revoke role when sender is grantee, and role is not expired nor revocable', async () => {
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRole(
          GrantRoleData.depositId,
          GrantRoleData.role,
          GrantRoleData.grantee,
          GrantRoleData.expirationDate,
          false,
          GrantRoleData.data,
        ),
      ).to.not.be.reverted

      await expect(
        ItemsRolesRegistryFacet.connect(grantee).revokeRole(
          GrantRoleData.depositId,
          GrantRoleData.role,
          GrantRoleData.grantee,
        ),
      )
        .to.emit(ItemsRolesRegistryFacet, 'RoleRevoked')
        .withArgs(GrantRoleData.depositId, GrantRoleData.role, GrantRoleData.grantee)
    })

    it('should revoke role when sender is grantor', async () => {
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).revokeRole(
          GrantRoleData.depositId,
          GrantRoleData.role,
          GrantRoleData.grantee,
        ),
      )
        .to.emit(ItemsRolesRegistryFacet, 'RoleRevoked')
        .withArgs(GrantRoleData.depositId, GrantRoleData.role, GrantRoleData.grantee)
    })

    it('should revoke role when sender is grantee', async () => {
      await expect(
        ItemsRolesRegistryFacet.connect(grantee).revokeRole(
          GrantRoleData.depositId,
          GrantRoleData.role,
          GrantRoleData.grantee,
        ),
      )
        .to.emit(ItemsRolesRegistryFacet, 'RoleRevoked')
        .withArgs(GrantRoleData.depositId, GrantRoleData.role, GrantRoleData.grantee)
    })

    it('should revoke role when sender is approved by grantor', async () => {
      await ItemsRolesRegistryFacet.connect(grantor).setRoleApprovalForAll(
        TokensCommitted.tokenAddress,
        anotherUser.address,
        true,
      )
      await expect(
        ItemsRolesRegistryFacet.connect(anotherUser).revokeRole(
          GrantRoleData.depositId,
          GrantRoleData.role,
          GrantRoleData.grantee,
        ),
      )
        .to.emit(ItemsRolesRegistryFacet, 'RoleRevoked')
        .withArgs(GrantRoleData.depositId, GrantRoleData.role, GrantRoleData.grantee)
    })

    it('should revoke role when sender is approved by grantee', async () => {
      await ItemsRolesRegistryFacet.connect(grantee).setRoleApprovalForAll(
        TokensCommitted.tokenAddress,
        anotherUser.address,
        true,
      )
      await expect(
        ItemsRolesRegistryFacet.connect(anotherUser).revokeRole(
          GrantRoleData.depositId,
          GrantRoleData.role,
          GrantRoleData.grantee,
        ),
      )
        .to.emit(ItemsRolesRegistryFacet, 'RoleRevoked')
        .withArgs(GrantRoleData.depositId, GrantRoleData.role, GrantRoleData.grantee)
    })
  })

  describe('releaseTokens', async () => {
    let TokensCommitted: Commitment
    let GrantRoleData: GrantRoleData

    beforeEach(async () => {
      TokensCommitted = buildCommitment({
        grantor: grantor.address,
        tokenAddress: wearableDiamondAddress,
      })
      depositIdsCounter++
      GrantRoleData = await buildGrantRole({
        depositId: depositIdsCounter,
        grantee: grantee.address,
        revocable: false,
      })
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).commitTokens(
          TokensCommitted.grantor,
          TokensCommitted.tokenAddress,
          TokensCommitted.tokenId,
          TokensCommitted.tokenAmount,
        ),
      ).to.not.be.reverted
    })

    it('should revert when sender is not grantor or approved', async () => {
      await ItemsRolesRegistryFacet.connect(grantor).setRoleApprovalForAll(
        TokensCommitted.tokenAddress,
        anotherUser.address,
        false,
      )
      await expect(ItemsRolesRegistryFacet.connect(anotherUser).releaseTokens(GrantRoleData.depositId)).to.be.revertedWith(
        'ItemsRolesRegistryFacet: account not approved',
      )
    })

    it('should revert when commitment has an active role', async () => {
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRole(
          GrantRoleData.depositId,
          GrantRoleData.role,
          GrantRoleData.grantee,
          GrantRoleData.expirationDate,
          GrantRoleData.revocable,
          GrantRoleData.data,
        ),
      ).to.not.be.reverted
      await expect(ItemsRolesRegistryFacet.connect(grantor).releaseTokens(GrantRoleData.depositId)).to.be.revertedWith(
        'ItemsRolesRegistryFacet: token has an active role',
      )
    })

    it('should withdraw tokens when sender is grantor', async () => {
      await expect(ItemsRolesRegistryFacet.connect(grantor).releaseTokens(GrantRoleData.depositId))
        .to.emit(ItemsRolesRegistryFacet, 'TokensReleased')
        .withArgs(GrantRoleData.depositId)
        .to.emit(libEventHandler, 'TransferSingle')
        .withArgs(
          grantor.address,
          aavegotchiDiamondAddress,
          grantor.address,
          TokensCommitted.tokenId,
          TokensCommitted.tokenAmount,
        )
    })

    it('should withdraw tokens when sender is approved', async () => {
      await ItemsRolesRegistryFacet.connect(grantor).setRoleApprovalForAll(
        TokensCommitted.tokenAddress,
        anotherUser.address,
        true,
      )
      await expect(ItemsRolesRegistryFacet.connect(anotherUser).releaseTokens(GrantRoleData.depositId))
        .to.emit(ItemsRolesRegistryFacet, 'TokensReleased')
        .withArgs(GrantRoleData.depositId)
        .to.emit(libEventHandler, 'TransferSingle')
        .withArgs(
          anotherUser.address,
          aavegotchiDiamondAddress,
          grantor.address,
          TokensCommitted.tokenId,
          TokensCommitted.tokenAmount,
        )
    })
  })

  describe('view functions', async () => {
    let TokensCommitted: Commitment
    let GrantRoleData: GrantRoleData

    beforeEach(async () => {
      TokensCommitted = buildCommitment({grantor: grantor.address})
      depositIdsCounter++
      GrantRoleData = await buildGrantRole({
        depositId: depositIdsCounter,
        grantee: grantee.address,
      })
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).commitTokens(
          TokensCommitted.grantor,
          TokensCommitted.tokenAddress,
          TokensCommitted.tokenId,
          TokensCommitted.tokenAmount,
        ),
      ).to.not.be.reverted
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRole(
          GrantRoleData.depositId,
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
        ItemsRolesRegistryFacet.connect(grantor).roleData(GrantRoleData.depositId, GrantRoleData.role, anotherUser.address),
      ).to.be.revertedWith('ItemsRolesRegistryFacet: grantee mismatch')
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).roleExpirationDate(
          GrantRoleData.depositId,
          GrantRoleData.role,
          anotherUser.address,
        ),
      ).to.be.revertedWith('ItemsRolesRegistryFacet: grantee mismatch')
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).isRoleRevocable(
          GrantRoleData.depositId,
          GrantRoleData.role,
          anotherUser.address,
        ),
      ).to.be.revertedWith('ItemsRolesRegistryFacet: grantee mismatch')
    })

    it('should return role data', async () => {
      expect(
        await ItemsRolesRegistryFacet.connect(grantor).roleExpirationDate(
          GrantRoleData.depositId,
          GrantRoleData.role,
          GrantRoleData.grantee,
        ),
      ).to.be.equal(GrantRoleData.expirationDate)

      expect(
        await ItemsRolesRegistryFacet.connect(grantor).roleData(
          GrantRoleData.depositId,
          GrantRoleData.role,
          GrantRoleData.grantee,
        ),
      ).to.be.equal(GrantRoleData.data)

      expect(
        await ItemsRolesRegistryFacet.connect(grantor).isRoleRevocable(
          GrantRoleData.depositId,
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
      expect(await ItemsRolesRegistryFacet.supportsInterface('0xc4c8a71d')).to.be.true
    })
  })

});
