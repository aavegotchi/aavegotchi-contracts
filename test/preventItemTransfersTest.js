/* global describe it before ethers */
/* eslint-disable  prefer-const */

const { expect } = require('chai')
const { preventItemTransfers } = require('../scripts/upgrades/upgrade-preventItemTransfers')
// const { addLeaderboardBadges } = require('../scripts/addItemTypes/addLeaderboardBadges')
const truffleAsserts = require('truffle-assertions')

async function impersonate (address, contract) {
  await network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [address]
  })
  let signer = await ethers.getSigner(address)
  contract = contract.connect(signer)
  return contract
}

describe('Testing prevent item transfers', function () {
  this.timeout(300000)
  const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'

  let itemsFacet
  let itemsTransferFacet
  let itemWhale
  let badgeRecipient
  let aavegotchiID

  before(async function () {
    const testing = ['hardhat', 'localhost'].includes(hre.network.name)

    badgeRecipient = '0x027Ffd3c119567e85998f4E6B9c3d83D5702660c'
    itemWhale = '0x51208e5cC9215c6360210C48F81C8270637a5218'
    aavegotchiID = '7938'

    if (testing) {
      await hre.network.provider.request({
        method: 'hardhat_reset',
        params: [{
          forking: {
            jsonRpcUrl: process.env.MATIC_URL
          }
        }]
      })
    }

    // First run the upgrade
    await preventItemTransfers()

    itemsTransferFacet = await ethers.getContractAt('ItemsTransferFacet', diamondAddress)
    itemsTransferFacet = await impersonate(itemWhale, itemsTransferFacet)
    itemsFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet', diamondAddress)

    // First some reason this is running twice but it's not important
    // await addLeaderboardBadges()
  })

  it('Can upload the leaderboard badges', async function () {
    let balance = await itemsFacet.balanceOf(badgeRecipient, '163')
    expect(balance).to.equal(10)
    balance = await itemsFacet.balanceOf(badgeRecipient, '166')
    // The minting is running twice
    expect(balance).to.equal(90)
  })
  it('Can still transfer items that are transferrable', async function () {
    await itemsTransferFacet.transferFromParent(diamondAddress, '7938', itemWhale, '23', '1')
    const ownerBalance = await itemsFacet.balanceOf(itemWhale, '23')
    expect(ownerBalance).to.equal(1)
  })

  it('Cannot transfer items that are non-transferable', async function () {
    // First lets transfer the items into an Aavegotchi. Once they've arrived, they can't be transferred out.

    itemsTransferFacet = await impersonate(badgeRecipient, itemsTransferFacet)
    await itemsTransferFacet.transferToParent(badgeRecipient, diamondAddress, aavegotchiID, '163', '1')

    const aavegotchiBadgeBalance = await itemsFacet.balanceOfToken(
      diamondAddress, aavegotchiID, '163')
    expect(aavegotchiBadgeBalance).to.equal(1)

    // Cannot transfer from Aavegotchi once it's inside
    itemsTransferFacet = await impersonate(itemWhale, itemsTransferFacet)

    await truffleAsserts.reverts(itemsTransferFacet.transferFromParent(diamondAddress, aavegotchiID, badgeRecipient, '163', '1'), 'Item cannot be transferred')

    await truffleAsserts.reverts(itemsTransferFacet.batchTransferFromParent(diamondAddress, aavegotchiID, badgeRecipient, ['163'], ['1']), 'Item cannot be transferred')

    await truffleAsserts.reverts(itemsTransferFacet.transferAsChild(diamondAddress, aavegotchiID, diamondAddress, '1484', '163', '1'), 'Item cannot be transferred')

    await truffleAsserts.reverts(itemsTransferFacet.batchTransferAsChild(diamondAddress, aavegotchiID, diamondAddress, '1484', ['163'], ['1']), 'Item cannot be transferred')
  })
})
