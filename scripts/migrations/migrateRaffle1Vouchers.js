/* global ethers hre */

require('dotenv').config()

// const { getEntrantWins } = require('./getWinsRaffle2.js')

async function main () {
  const aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  // const voucherContractAddress = '0xe54891774EED9277236bac10d82788aee0Aed313'

  const raffleAbi = [
    'function raffleSupply() external view returns (uint256 raffleSupply_)',
    'function getEntrants(uint256 _raffleId) external view returns (address[] memory entrants_)',
    'function getEntries(uint256 _raffleId, address _entrant) external view returns (tuple(address ticketAddress, uint256 ticketId, uint256 ticketQuantity, uint256 rangeStart, uint256 rangeEnd, uint256 raffleItemIndex, bool prizesClaimed)[] entries_)',
    'function getRaffles() external view returns (tuple(uint256 raffleId, uint256 raffleEnd, bool isOpen)[] raffles_)',
    'function winners(uint256 _raffleId, address[] memory _entrants) external view returns (tuple(address entrant, bool claimed, uint256 userEntryIndex, uint256 raffleItemIndex, uint256 raffleItemPrizeIndex, uint256[] winningPrizeNumbers, uint256 prizeId)[] winners_)',
    'function raffleInfo(uint256 _raffleId) external view returns (uint256 raffleEnd_, tuple(address ticketAddress, uint256 ticketId, tuple(address prizeAddress, uint256 prizeId, uint256 prizeQuantity)[] raffleItemPrizes)[] raffleItems_, uint256 randomNumber_)'
  ]

  const itemMapping = new Map()
  for (let i = 0; i < 54; i++) {
    itemMapping.set(i.toString(), i + 1)
  }

  const voucherMigration = await ethers.getContractAt('VoucherMigrationFacet', aavegotchiDiamondAddress)
  const ethereumProvider = new ethers.providers.JsonRpcProvider(process.env.MAINNET_URL)
  const raffle = await ethers.getContractAt(raffleAbi, '0x144d196Bf99a4EcA33aFE036Da577d7D66583DB6', ethereumProvider)
  // raffles 1 & 2
  const raffleId = 0
  // const raffleInfo = await raffle.raffleInfo(raffleId)
  // console.log(JSON.stringify(raffleInfo, null, 2))
  const entrants = await raffle.getEntrants(raffleId)
  console.log((new Set(entrants)).size)
  console.log('Total entrants: ', entrants.length)
  const outOfGas = ['0xCabdBFCf0aA88743D0552f4FAb6b7B8203A3cdE2', '0x2c123fc5C27888571CD525e8ae9b0c5ff848386D']
  let count = 0
  let start = false
  for (const entrant of entrants) {
    count++
    if (entrant === '0x2c123fc5C27888571CD525e8ae9b0c5ff848386D') {
      start = true
    }
    if (start === false) {
      continue
    }
    if (outOfGas.includes(entrant)) {
      continue
    }
    console.log('Count:', count, ' | Getting data for ', entrant)
    const entrantData = await raffle.winners(raffleId, [entrant], { from: entrant })
    if (entrantData.length > 0 && !entrantData[0].claimed) {
      const ids = []
      const values = []
      for (const entrantItem of entrantData) {
        // console.log(entrantItem.prizeId.toString())
        ids.push(itemMapping.get(entrantItem.prizeId.toString()))
        values.push(entrantItem.winningPrizeNumbers.length)
      }
      const batch = [{ owner: entrant, ids: ids, values: values }]
      console.log(JSON.stringify(batch, null, 2))
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
