/* global ethers */
/* eslint-disable  prefer-const */

async function main () {
  let aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
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
