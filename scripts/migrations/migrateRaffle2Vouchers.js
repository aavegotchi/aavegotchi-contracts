/* global ethers hre */

require('dotenv').config()

const { getEntrantWins } = require('./getWinsRaffle2.js')

async function main () {
  const aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'

  const raffleAbi = [
    'function raffleSupply() external view returns (uint256 raffleSupply_)',
    'function getEntrants(uint256 _raffleId) external view returns (address[] memory entrants_)',
    'function getEntries(uint256 _raffleId, address _entrant) external view returns (tuple(address ticketAddress, uint256 ticketId, uint256 ticketQuantity, uint256 rangeStart, uint256 rangeEnd, uint256 raffleItemIndex, bool prizesClaimed)[] entries_)',
    'function getRaffles() external view returns (tuple(uint256 raffleId, uint256 raffleEnd, bool isOpen)[] raffles_)',
    'function raffleInfo(uint256 _raffleId) external view returns (uint256 raffleEnd_, tuple(address ticketAddress, uint256 ticketId, uint256 totalEntered, tuple(address prizeAddress, uint256 prizeId, uint256 prizeQuantity)[] raffleItemPrizes)[] raffleItems_, uint256 randomNumber_)'
  ]

  const itemMapping = new Map()
  for (let i = 0; i < 54; i++) {
    itemMapping.set(i.toString(), i + 1)
  }

  const voucherMigration = await ethers.getContractAt('VoucherMigrationFacet', aavegotchiDiamondAddress)
  const ethereumProvider = new ethers.providers.JsonRpcProvider(process.env.MAINNET_URL)
  const raffle = await ethers.getContractAt(raffleAbi, '0xAFFF04FbFe54Cc985E25493A8F9D7114012D6d6F', ethereumProvider)
  // raffles 1 & 2
  const raffleId = 2
  const entrants = await raffle.getEntrants(raffleId)
  // console.log((new Set(entrants)).size)
  console.log('Total entrants: ', entrants.length)
  const raffleInfo = await raffle.raffleInfo(raffleId)
  let count = 0
  for (const entrant of entrants) {
    count++
    console.log('Getting data from ', count, ':', entrant)
    const wins = await getEntrantWins(raffle, raffleId, entrant, raffleInfo)
    if (wins.length > 0) {
      console.log('Found unclaimed prizes')
      const ids = []
      const values = []
      for (const win of wins) {
        ids.push(itemMapping.get(win.prizeId.toString()))
        values.push(win.quantity)
      }
      const batch = [{ owner: entrant, ids: ids, values: values }]
      console.log(batch)
      const tx = await voucherMigration.migrateVouchers(batch, { gasLimit: 10000000 })
      console.log('migration tx:', tx.hash)
      const receipt = await tx.wait()
      if (!receipt.status) {
        throw Error(`Migration batch failed: ${tx.hash}`)
      }
    }
  }

  console.log('Migration success!')
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
