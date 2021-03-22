/* global ethers */
/* eslint-disable  prefer-const */

async function main () {
  let aavegotchiDiamondAddress = '0xd0576c4371bBb9e531700898760B0064237832Ee'
  console.log(aavegotchiDiamondAddress)
  let itemsFacet = await ethers.getContractAt('SvgFacet', aavegotchiDiamondAddress)
  let svg = await itemsFacet.getItemSvg(115)
  console.log(svg)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
