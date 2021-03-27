/* global ethers hre */
/* eslint-disable  prefer-const */

const { LedgerSigner } = require('@ethersproject/hardware-wallets')
const { itemTypes } = require('./raffle4ItemTypes.js')
const { wearablesSvgs, sleevesSvgs } = require('../svgs/raffe4Wearables.js')

let signer
const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
const gasLimit = 15000000

async function uploadSvgs (svgs) {
  let svgFacet = (await ethers.getContractAt('SvgFacet', diamondAddress)).connect(signer)
  function setupSvg (...svgData) {
    const svgTypesAndSizes = []
    const svgItems = []
    for (const [svgType, svg] of svgData) {
      svgItems.push(svg.join(''))
      svgTypesAndSizes.push([ethers.utils.formatBytes32String(svgType), svg.map(value => value.length)])
    }
    return [svgItems.join(''), svgTypesAndSizes]
  }

  // eslint-disable-next-line no-unused-vars
  function printSizeInfo (svgTypesAndSizes) {
    console.log('------------- SVG Size Info ---------------')
    let sizes = 0
    for (const [svgType, size] of svgTypesAndSizes) {
      console.log(ethers.utils.parseBytes32String(svgType) + ':' + size)
      for (const nextSize of size) {
        sizes += nextSize
      }
    }
    console.log('Total sizes:' + sizes)
  }

  console.log('Uploading ', svgs.length, ' svgs')
  let svg, svgTypesAndSizes
  console.log('Number of svg:' + svgs.length)
  let svgItemsStart = 0
  let svgItemsEnd = 0
  while (true) {
    let itemsSize = 0
    while (true) {
      if (svgItemsEnd === svgs.length) {
        break
      }
      itemsSize += svgs[svgItemsEnd].length
      if (itemsSize > 24576) {
        break
      }
      svgItemsEnd++
    }
    ;[svg, svgTypesAndSizes] = setupSvg(
      ['wearables', svgs.slice(svgItemsStart, svgItemsEnd)]
    )
    console.log(`Uploading ${svgItemsStart} to ${svgItemsEnd} wearable SVGs`)
    printSizeInfo(svgTypesAndSizes)
    let tx = await svgFacet.storeSvg(svg, svgTypesAndSizes, { gasLimit: gasLimit })
    let receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`)
    }
    console.log(svgItemsEnd, svg.length)
    if (svgItemsEnd === svgs.length) {
      break
    }
    svgItemsStart = svgItemsEnd
  }
}

async function main () {
  let owner = await (await ethers.getContractAt('OwnershipFacet', diamondAddress)).owner()
  if (['hardhat', 'localhost'].includes(hre.network.name)) {
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [owner]
    })
    signer = await ethers.provider.getSigner(owner)
  } else if (hre.network.name === 'matic') {
    signer = new LedgerSigner(ethers.provider)
  } else {
    throw Error('Incorrect network selected')
  }
  let tx
  let receipt
  let itemsFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet', diamondAddress)
  let daoFacet = (await ethers.getContractAt('DAOFacet', diamondAddress)).connect(signer)
  let svgFacet = (await ethers.getContractAt('SvgFacet', diamondAddress)).connect(signer)
  console.log('Adding items')
  console.log(itemTypes.length)
  tx = await daoFacet.addItemTypes(itemTypes, { gasLimit: gasLimit })
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`)
  }
  console.log('Items were added:', tx.hash)
  // let item = await itemsFacet.getItemType(161)
  // console.log('Item:', item)

  await uploadSvgs(wearablesSvgs)
  await uploadSvgs(sleevesSvgs.map(value => value.svg))

  let sleevesSvgId = 23
  let sleeves = []
  for (const sleeve of sleevesSvgs) {
    sleeves.push(
      {
        sleeveId: sleevesSvgId,
        wearableId: sleeve.id
      }
    )
    sleevesSvgId++
  }
  console.log('Associating sleeves svgs with body wearable svgs.')
  tx = await svgFacet.setSleeves(sleeves, { gasLimit: gasLimit })
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`)
  }
  console.log('Sleeves associated:', tx.hash)

  // deploy raffle:
  console.log('Deploying raffle')
  let vrfCoordinator = '0x3d2341ADb2D31f1c5530cDC622016af293177AE0'
  let linkAddress = '0xb0897686c545045aFc77CF20eC7A532E3120E0F1'
  let keyHash = '0xf86195cf7690c55907b2b611ebb7343a6f649bff128701cc542f0569e2c549da'
  let fee = ethers.utils.parseEther('0.0001')
  const RafflesContract = await ethers.getContractFactory('RafflesContract')
  const rafflesContract = await RafflesContract.deploy(owner, vrfCoordinator, linkAddress, keyHash, fee)
  await rafflesContract.deployed()
  console.log('Deployed RaffleContract:' + rafflesContract.address)

  // let aavegotchiDiamondAddress = '0xd0576c4371bBb9e531700898760B0064237832Ee'
  // let aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  // console.log(aavegotchiDiamondAddress)
  // let svgFacet = await ethers.getContractAt('SvgFacet', aavegotchiDiamondAddress)
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
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
