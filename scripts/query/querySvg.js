/* global ethers */
/* eslint-disable  prefer-const */

async function main () {
  // let aavegotchiDiamondAddress = '0xd0576c4371bBb9e531700898760B0064237832Ee'
  let aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  console.log(aavegotchiDiamondAddress)
  let svgFacet = await ethers.getContractAt('SvgFacet', aavegotchiDiamondAddress)
  // let aavegotchi = await svgFacet.getAavegotchiSvg(4685)
  // let aavegotchi = await svgFacet.getAavegotchiSvg(3564)
  // pajamas:
  // let aavegotchi = await svgFacet.getAavegotchiSvg(8120)
  // aagent
  // let aavegotchi = await svgFacet.getAavegotchiSvg(9887)
  // uni eyes  5795
  // hawwain shirt
  // let aavegotchi = await svgFacet.getAavegotchiSvg(301)
  // console.log(aavegotchi)
  // let svgs = await itemsFacet.getSvgs(ethers.utils.formatBytes32String('eyeShapes'), [20, 21, 22, 23, 24])
  // let count = 20
  // for (const svg of svgs) {
  //   console.log(count)
  //   console.log(svg)
  //   count++
  //   console.log('  -   ')
  // }
  // let aavegotchi = await svgFacet.getAavegotchiSvg(7422)
  // console.log(aavegotchi)
  // 22
  let result = await svgFacet.getSvg(ethers.utils.formatBytes32String('sleeves'), 23)
  console.log(result)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
