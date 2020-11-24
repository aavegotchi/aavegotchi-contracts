/* global ethers hre */

const diamond = require('diamond-util')
const { aavegotchiSvgs } = require('../svgs/aavegotchi.js')
const { wearablesSvgs } = require('../svgs/wearables.js')
const { collateralsSvgs } = require('../svgs/collaterals.js')
const { eyeShapeSvgs } = require('../svgs/eyeShapes.js')
const { getCollaterals } = require('./collateralTypes.js')
const { wearableTypes } = require('./wearableTypes.js')

function addCommas(nStr) {
  nStr += ''
  const x = nStr.split('.')
  let x1 = x[0]
  const x2 = x.length > 1 ? '.' + x[1] : ''
  var rgx = /(\d+)(\d{3})/
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2')
  }
  return x1 + x2
}

function strDisplay(str) {
  return addCommas(str.toString())
}

async function main() {
  const accounts = await ethers.getSigners()
  const account = await accounts[0].getAddress()
  console.log('Account: ' + account)
  console.log('---')
  let tx
  let totalGasUsed = ethers.BigNumber.from('0')
  let receipt
  let vrfCoordinator
  let linkAddress
  let linkContract
  let keyHash
  let fee
  let vouchersContractAddress
  let vouchersContract
  let initialHauntSize

  if (hre.network.name === 'hardhat') {
    const LinkTokenMock = await ethers.getContractFactory('LinkTokenMock')
    linkContract = await LinkTokenMock.deploy()
    await linkContract.deployed()
    linkAddress = linkContract.address
    const VouchersContract = await ethers.getContractFactory('VouchersContract')
    vouchersContract = await VouchersContract.deploy(account)
    await vouchersContract.deployed()
    vouchersContractAddress = vouchersContract.address
    vrfCoordinator = account
    keyHash = '0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4'
    fee = ethers.utils.parseEther('0.1')
    initialHauntSize = "100"
  } else if (hre.network.name === 'mainnet') {
    vrfCoordinator = '0xf0d54349aDdcf704F77AE15b96510dEA15cb7952'
    linkAddress = '0x514910771AF9Ca656af840dff83E8264EcF986CA'
    keyHash = '0xAA77729D3466CA35AE8D28B3BBAC7CC36A5031EFDC430821C02BC31A238AF445'
    fee = ethers.utils.parseEther('2')
    vouchersContractAddress = '0xe54891774EED9277236bac10d82788aee0Aed313'
    initialHauntSize = "10000"
  } else if (hre.network.name === 'kovan') {
    vrfCoordinator = '0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9'
    linkAddress = '0xa36085F69e2889c224210F603D836748e7dC0088'
    keyHash = '0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4'
    fee = ethers.utils.parseEther('0.1')
    vouchersContractAddress = ''
    initialHauntSize = "10000"
  } else {
    throw Error('No network settings for ' + hre.network.name)
  }

  async function deployFacets(...facets) {
    const instances = []
    for (let facet of facets) {
      let constructorArgs = []
      if (Array.isArray(facet)) {
        ;[facet, constructorArgs] = facet
      }
      const factory = await ethers.getContractFactory(facet)
      const facetInstance = await factory.deploy(...constructorArgs)
      await facetInstance.deployed()
      const tx = facetInstance.deployTransaction
      const receipt = await tx.wait()
      console.log(`${facet} deploy gas used:` + strDisplay(receipt.gasUsed))
      totalGasUsed = totalGasUsed.add(receipt.gasUsed)
      instances.push(facetInstance)
    }
    return instances
  }
  let [
    diamondCutFacet,
    diamondLoupeFacet,
    ownershipFacet,
    aavegotchiFacet,
    svgStorageFacet,
    wearablesFacet,
    collateralFacet,
    escrowFacet,
    vrfFacet,
    shopFacet
  ] = await deployFacets(
    'DiamondCutFacet',
    'DiamondLoupeFacet',
    'OwnershipFacet',
    'AavegotchiFacet',
    'SvgStorageFacet',
    'WearablesFacet',
    'CollateralFacet',
    'EscrowFacet',
    ['VrfFacet', [vrfCoordinator, linkAddress]],
    ['ShopFacet', [vouchersContractAddress]]
  )

  let ghstDiamond
  if (hre.network.name === 'kovan') {
    ghstDiamond = await ethers.getContractAt('GHSTFacet', '0xeDaA788Ee96a0749a2De48738f5dF0AA88E99ab5')
    console.log('GHST diamond address:' + ghstDiamond.address)
  } else if (hre.network.name === 'hardhat') {
    ghstDiamond = await diamond.deploy({
      diamondName: 'GHSTDiamond',
      facets: [
        ['DiamondCutFacet', diamondCutFacet],
        ['DiamondLoupeFacet', diamondLoupeFacet],
        ['OwnershipFacet', ownershipFacet],
        'GHSTFacet'
      ],
      args: [account]
    })
    ghstDiamond = await ethers.getContractAt('GHSTFacet', ghstDiamond.address)
    console.log('GHST diamond address:' + ghstDiamond.address)
  }

  // eslint-disable-next-line no-unused-vars
  const aavegotchiDiamond = await diamond.deploy({
    diamondName: 'AavegotchiDiamond',
    facets: [
      ['DiamondCutFacet', diamondCutFacet],
      ['DiamondLoupeFacet', diamondLoupeFacet],
      ['OwnershipFacet', ownershipFacet],
      ['AavegotchiFacet', aavegotchiFacet],
      ['SvgStorageFacet', svgStorageFacet],
      ['WearablesFacet', wearablesFacet],
      ['CollateralFacet', collateralFacet],
      ['EscrowFacet', escrowFacet],
      ['VrfFacet', vrfFacet],
      ['ShopFacet', shopFacet]
    ],
    args: [account, account, ghstDiamond.address, keyHash, fee, initialHauntSize]
  })
  console.log('Aavegotchi diamond address:' + aavegotchiDiamond.address)

  tx = aavegotchiDiamond.deployTransaction
  receipt = await tx.wait()
  console.log('Aavegotchi diamond deploy gas used:' + strDisplay(receipt.gasUsed))
  totalGasUsed = totalGasUsed.add(receipt.gasUsed)

  diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', aavegotchiDiamond.address)
  vrfFacet = await ethers.getContractAt('VrfFacet', aavegotchiDiamond.address)
  aavegotchiFacet = await ethers.getContractAt('AavegotchiFacet', aavegotchiDiamond.address)
  escrowFacet = await ethers.getContractAt('EscrowFacet', aavegotchiDiamond.address)
  collateralFacet = await ethers.getContractAt('CollateralFacet', aavegotchiDiamond.address)
  shopFacet = await ethers.getContractAt('ShopFacet', aavegotchiDiamond.address)

  // add collateral info
  console.log('Adding Collateral Types')
  tx = await collateralFacet.addCollateralTypes(getCollaterals(hre.network.name, ghstDiamond.address))
  receipt = await tx.wait()
  console.log('Adding Collateral Types gas used::' + strDisplay(receipt.gasUsed))
  totalGasUsed = totalGasUsed.add(receipt.gasUsed)

  wearablesFacet = await ethers.getContractAt('WearablesFacet', aavegotchiDiamond.address)

  // add wearable types info
  console.log('Adding Wearable Types')
  tx = await wearablesFacet.addWearableTypes(wearableTypes)
  receipt = await tx.wait()
  console.log('Adding Wearable Types gas used::' + strDisplay(receipt.gasUsed))
  totalGasUsed = totalGasUsed.add(receipt.gasUsed)

  // ----------------------------------------------------------------
  // Upload Svg layers
  svgStorageFacet = await ethers.getContractAt('SvgStorageFacet', aavegotchiDiamond.address)

  function setupSvg(...svgData) {
    const svgTypesAndSizes = []
    const svgs = []
    for (const [svgType, svg] of svgData) {
      svgs.push(svg.join(''))
      svgTypesAndSizes.push([ethers.utils.formatBytes32String(svgType), svg.map(value => value.length)])
    }
    return [svgs.join(''), svgTypesAndSizes]
  }

  // eslint-disable-next-line no-unused-vars
  function printSizeInfo(svgTypesAndSizes) {
    console.log('------------- SVG Size Info ---------------')
    let sizes = 0
    for (const [svgType, size] of svgTypesAndSizes) {
      console.log(ethers.utils.parseBytes32String(svgType) + ':' + size)
      for (const nextSize of size) {
        sizes += nextSize
      }
    }
    console.log('Total sizes:' + sizes)
    console.log('-------------------------------------------')
  }
  console.log('Uploading aavegotchi and wearable Svgs')
  let [svg, svgTypesAndSizes] = setupSvg(
    ['aavegotchi', aavegotchiSvgs],
    ['wearables', wearablesSvgs]
  )
  // printSizeInfo(svgTypesAndSizes)
  tx = await svgStorageFacet.storeSvg(svg, svgTypesAndSizes)
  console.log('Uploaded SVGs')
  receipt = await tx.wait()
  console.log('Gas used:' + strDisplay(receipt.gasUsed))
  totalGasUsed = totalGasUsed.add(receipt.gasUsed)

  console.log('Uploading collaterals and eyeShapes')
    ;[svg, svgTypesAndSizes] = setupSvg(
      ['collaterals', collateralsSvgs],
      ['eyeShapes', eyeShapeSvgs]
    )
  // printSizeInfo(svgTypesAndSizes)
  tx = await svgStorageFacet.storeSvg(svg, svgTypesAndSizes)
  console.log('Uploaded SVGs')
  receipt = await tx.wait()
  console.log('Gas used:' + strDisplay(receipt.gasUsed))
  totalGasUsed = totalGasUsed.add(receipt.gasUsed)

  console.log('Total gas used: ' + strDisplay(totalGasUsed))
  return {
    account: account,
    aavegotchiDiamond: aavegotchiDiamond,
    diamondLoupeFacet: diamondLoupeFacet,
    ghstDiamond: ghstDiamond,
    wearablesFacet: wearablesFacet,
    aavegotchiFacet: aavegotchiFacet,
    collateralFacet: collateralFacet,
    escrowFacet: escrowFacet,
    vrfFacet: vrfFacet,
    vouchersContract: vouchersContract,
    shopFacet: shopFacet,
    linkAddress: linkAddress,
    linkContract: linkContract
  }

  // ----------------------------------------------------------------
  // Mint Aavegotchi with Svg Layers

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
  // console.log('Mint Aavegotchi with Svg Layers')

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
  // Get the combined Svg of an Aavegotchi.

  // const svg = await aavegotchiNFT.getAavegotchiSvg(0)
  // console.log('Get the combined Svg of an Aavegotchi.')
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
