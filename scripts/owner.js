/* global ethers hre */

const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
// kovan
// const diamondAddress = '0xE47d2d47aA7fd150Fe86045e81509B09454a4Ee5'

async function main () {
  const diamond = await ethers.getContractAt('OwnershipFacet', diamondAddress)
  const owner = await diamond.owner()
  console.log('Owner:  ', owner)
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
