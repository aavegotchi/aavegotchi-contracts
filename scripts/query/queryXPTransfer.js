/* global ethers hre */

async function main () {
  const diamondCreationBlock = 11516320
  const aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  let events = []
  let diamond
  diamond = await ethers.getContractAt('CollateralFacet', aavegotchiDiamondAddress)
  let filter
  filter = diamond.filters.ExperienceTransfer(1428)
  let results
  results = await diamond.queryFilter(filter, diamondCreationBlock)
  

  for (const result of results) {

    const args = result.args

    console.log(`${args.experience.toString()} Experience transferred from ${args._fromTokenId.toString()} to ${args._toTokenId.toString()} in block number ${result.blockNumber}`)
  }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
