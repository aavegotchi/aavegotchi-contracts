/* global ethers */

// We require the Buidler Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.
// eslint-disable-next-line no-unused-vars
const bre = require('@nomiclabs/buidler')

const diamond = require('diamond-util')
const { aavegotchiSVGs } = require('../svgs/aavegotchi.js')
const { farmerSVGs } = require('../svgs/farmer.js')
const { itemSVGs } = require('../svgs/items.js')
const { getCollaterals } = require('./collaterals.js')

async function main () {
  const accounts = await ethers.getSigners()
  const account = await accounts[0].getAddress()
  console.log('Account: ' + account)
  console.log('---')

  const DiamondLoupeFacetFactory = await ethers.getContractFactory('DiamondLoupeFacet')
  const diamondLoupeFacet = await DiamondLoupeFacetFactory.deploy()
  await diamondLoupeFacet.deployed()

  let ghstDiamond
  if (bre.network.name === 'kovan') {
    ghstDiamond = await ethers.getContractAt('GHSTFacet', '0xeDaA788Ee96a0749a2De48738f5dF0AA88E99ab5')
    console.log('GHST diamond address:' + ghstDiamond.address)
  } else if (bre.network.name === 'mainnet' || bre.network.name === 'buidlerevm') {
    ghstDiamond = await diamond.deploy({
      diamondName: 'GHSTDiamond',
      facets: [
        'DiamondCutFacet',
        ['DiamondLoupeFacet', diamondLoupeFacet],
        'OwnershipFacet',
        'GHSTFacet'
      ],
      owner: account,
      otherArgs: []
    })
    ghstDiamond = await ethers.getContractAt('GHSTFacet', ghstDiamond.address)
    console.log('GHST diamond address:' + ghstDiamond.address)
  }

  // eslint-disable-next-line no-unused-vars
  const aavegotchiDiamond = await diamond.deploy({
    diamondName: 'AavegotchiDiamond',
    facets: [
      'DiamondCutFacet',
      ['DiamondLoupeFacet', diamondLoupeFacet],
      'OwnershipFacet',
      'AavegotchiFacet',
      'SVGStorageFacet',
      'WearablesFacet'
    ],
    owner: account,
    otherArgs: [ghstDiamond.address, getCollaterals(bre.network.name, ghstDiamond.address)]
  })
  console.log('Aavegotchi diamond address:' + aavegotchiDiamond.address)

  // ----------------------------------------------------------------
  // Upload SVG layers
  let sizes
  let svgs
  const svgStorageFacet = await ethers.getContractAt('SVGStorageFacet', aavegotchiDiamond.address)

  svgs = aavegotchiSVGs
  sizes = svgs.map(value => value.length)
  svgs = svgs.join('')
  console.log('Uploading Aavegotchi SVG Layers...')
  await svgStorageFacet.storeAavegotchiLayersSVG(svgs, sizes)
  console.log('Uploaded Aavegotchi SVG Layers')

  svgs = farmerSVGs
  sizes = svgs.map(value => value.length)
  svgs = svgs.join('')
  console.log('Uploading Wearables SVG...')
  await svgStorageFacet.storeWearablesSVG(svgs, sizes)
  console.log('Uploaded Wearables SVG')

  svgs = itemSVGs
  sizes = svgs.map((value) => value.length)
  svgs = svgs.join('')
  console.log('Uploading Items SVG...')
  await svgStorageFacet.storeItemsSVG(svgs, sizes)
  console.log('Uploaded Items SVG')

  const aavegotchiFacet = await ethers.getContractAt('AavegotchiFacet', aavegotchiDiamond.address)

  return {
    account: account,
    aavegotchiDiamond: aavegotchiDiamond,
    ghstDiamond: ghstDiamond,
    aavegotchiFacet: aavegotchiFacet
  }

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
  // function wearableId (id) {
  //   return ethers.BigNumber.from(id).mul(ethers.BigNumber.from(2).pow(240))
  // }
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
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

exports.deployProject = main
