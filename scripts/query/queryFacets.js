/* global ethers hre */
/* eslint-disable  prefer-const */

async function main () {
  const aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  const diamond = await ethers.getContractAt('DiamondLoupeFacet', aavegotchiDiamondAddress)
  // const facets = await diamond.facets()
  // console.log(facets)
  const facet = await diamond.facetAddress('0x1c4695f4')
  console.log(facet)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
