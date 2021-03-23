/* global ethers */
/* eslint-disable  prefer-const */

async function main () {
  let aavegotchiDiamondAddress = '0xd0576c4371bBb9e531700898760B0064237832Ee'
  console.log(aavegotchiDiamondAddress)
  let itemsFacet = await ethers.getContractAt('SvgFacet', aavegotchiDiamondAddress)
  let svgs = await itemsFacet.getSvgs(ethers.utils.formatBytes32String('eyeShapes'), [20, 21, 22, 23, 24])
  let count = 20
  for (const svg of svgs) {
    console.log(count)
    console.log(svg)
    count++
    console.log('  -   ')
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
