/* global ethers */

// We require the Buidler Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.
// eslint-disable-next-line no-unused-vars
const bre = require('@nomiclabs/buidler')

async function main () {
  // Buidler always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await bre.run('compile');

  // We get the contract to deploy
  const AavegotchiDiamond = await ethers.getContractFactory('Aavegotchi')
  const aavegotchiDiamond = AavegotchiDiamond.attach('0x187DffAef821d03055aC5eAa1524c53EBB36eA97')

  const SVGStorage = await ethers.getContractFactory('SVGStorage')
  const svgStorage = SVGStorage.attach(aavegotchiDiamond.address)

  // ----------------------------------------------------------------
  // Upload SVG layers

  let svgs = [
    // hands
    '<g fill="#64438e"><path d="M14 40h1v1h-1z"/><path d="M14 42v-1h-2v1h1zm-1-8h1v1h-1z"/><path d="M14 33h1v1h-1zm-2 2h1v1h-1zm-3 8h3v-1H8v1zm-1-6v1h2v-1H9z"/><path d="M10 36v1h2v-1h-1zm-3 3v3h1v-4H7zm42 1h1v1h-1zm1-6h1v1h-1z"/><path d="M49 33h1v1h-1zm2 2h1v1h-1zm5 3v4h1v-4zm-5 3h-1v1h2v-1z"/><path d="M54 42h-2v1h4v-1h-1zm1-5h-1v1h2v-1z"/><path d="M53 36h-1v1h2v-1z"/></g><g fill="#edd3fd"><path d="M14 39h1v1h-1z"/><path d="M12 40v1h2v-1h-1z"/><path d="M10 41H8v1h4v-1h-1zm39-2h1v1h-1z"/><path d="M51 40h-1v1h2v-1z"/><path d="M55 41h-3v1h4v-1z"/></g><path d="M14 35h-1v1h-1v1h-2v1H8v3h4v-1h2v-1h1v-5h-1zm41 3h-1v-1h-2v-1h-1v-1h-1v-1h-1v5h1v1h2v1h4v-3z" fill="#fff"/>'
  ]
  const sizes = svgs.map(value => value.length)
  svgs = svgs.join('')
  await svgStorage.storeAavegotchiLayersSVG(svgs, sizes)
  console.log('Uploaded Aavegotchi SVG Layers')

  // ----------------------------------------------------------------
  // Mint Aavegotchi with SVG Layers

  // let svgLayers = [0, 1, 2, 3]
  // svgLayers = svgLayers.map(value => {
  //   value = ethers.utils.hexlify(value)
  //   value = value.slice(2)
  //   if (value.length === 2) {
  //     value = '00' + value
  //   }
  //   return value
  // })
  // svgLayers = '0x' + svgLayers.join('').padEnd(64, '0')
  // await aavegotchiNFT.mintAavegotchi(svgLayers)
  // console.log('Mint Aavegotchi with SVG Layers')

  // ----------------------------------------------------------------
  // Mint Wearables
  // await wearables.mintWearables()
  // console.log('Minted one set of wearables')

  // ----------------------------------------------------------------
  // Add Wearables
  // transferToParent(address _from, address _toContract, uint _toTokenId, uint _id, uint _value)
  function wearableId (id) {
    return ethers.BigNumber.from(id).mul(ethers.BigNumber.from(2).pow(240))
  }
  // const id1 = wearableId(1)
  // const id2 = wearableId(2)
  // const id3 = wearableId(3)
  // await wearables.transferToParent(address, aavegotchiDiamond.address, 0, id1, 1)
  // await wearables.transferToParent(address, aavegotchiDiamond.address, 0, id2, 1)
  // await wearables.transferToParent(address, aavegotchiDiamond.address, 0, id3, 1)
  // console.log('Added wearables')

  // ----------------------------------------------------------------
  // Send some ether
  // const tx = accounts[0].sendTransaction({
  //   to: '0x0b22380B7c423470979AC3eD7d3c07696773dEa1',
  //   value: ethers.utils.parseEther('0.1')
  // })

  // ----------------------------------------------------------------
  // Get the combined SVG of an Aavegotchi.

  // const svg = await aavegotchiNFT.getAavegotchiSVG(0)
  // console.log('Get the combined SVG of an Aavegotchi.')
  // console.log()
  // console.log(svg)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
