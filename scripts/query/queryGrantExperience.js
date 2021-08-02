/* global ethers hre */

async function main () {
  const diamondCreationBlock = 14710180
  const aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  let events = []
  let diamond
  diamond = await ethers.getContractAt('DAOFacet', aavegotchiDiamondAddress)
  let filter
  filter = diamond.filters.GrantExperience()
  let results
  results = await diamond.queryFilter(filter, diamondCreationBlock)
  

  for (const result of results) {

    const args = result.args
    
    args[1].forEach((amt) => {
      console.log('amt:',amt)
    });

  //  console.log('args:',args[1])

    

   /* console.log(`${args.experience.toString()} Experience transferred from ${args._fromTokenId.toString()} to ${args._toTokenId.toString()} in block number ${result.blockNumber}`)*/
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
