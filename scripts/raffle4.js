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
  const testing = ['hardhat', 'localhost'].includes(hre.network.name)
  if (testing) {
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
  let itemsTransferFacet = (await ethers.getContractAt('contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet', diamondAddress)).connect(signer)
  let daoFacet = (await ethers.getContractAt('DAOFacet', diamondAddress)).connect(signer)
  let svgFacet = (await ethers.getContractAt('SvgFacet', diamondAddress)).connect(signer)
  console.log('Adding ', itemTypes.length, ' items')
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

  let rafflesContract = await RafflesContract.deploy(owner, vrfCoordinator, linkAddress, keyHash, fee)
  await rafflesContract.deployed()
  rafflesContract = await rafflesContract.connect(signer)
  console.log('Deployed RaffleContract:' + rafflesContract.address)

  const itemIds = []
  const quantities = []
  for (const itemType of itemTypes) {
    itemIds.push(itemType.svgId)
    quantities.push(itemType.maxQuantity)
  }
  console.log('Mint prize items')
  tx = await daoFacet.mintItems(owner, itemIds, quantities)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`)
  }
  console.log('Prize items minted:', tx.hash)

  const ticketAddress = '0xA02d547512Bb90002807499F05495Fe9C4C3943f'
  const raffleItems = []
  for (let ticketId = 0; ticketId < 6; ticketId++) {
    raffleItems.push({
      ticketAddress: ticketAddress,
      ticketId: ticketId,
      raffleItemPrizes: []
    })
  }

  const ticketType = new Map()
  ticketType.set(1000, 0)
  ticketType.set(500, 1)
  ticketType.set(250, 2)
  ticketType.set(100, 3)
  ticketType.set(50, 4)
  ticketType.set(5, 5)

  for (const itemType of itemTypes) {
    raffleItems[ticketType.get(itemType.maxQuantity)].raffleItemPrizes.push({
      prizeAddress: diamondAddress,
      prizeId: itemType.svgId,
      prizeQuantity: itemType.maxQuantity
    })
  }
  console.log('Raffle items:')
  // console.log(raffleItems)

  console.log('Approve rafflesContract for wearable prizes')
  tx = await itemsTransferFacet.setApprovalForAll(rafflesContract.address, true)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`)
  }
  console.log('Set approval: ', tx.hash)

  console.log('Starting raffle')
  let raffleDuration
  // 86400 = 1 day
  const threeDays = 86400 * 3
  const fiveMinutes = 60 * 5
  if (testing) {
    raffleDuration = fiveMinutes
  } else {
    raffleDuration = threeDays
  }

  tx = await rafflesContract.startRaffle(raffleDuration, raffleItems)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`)
  }
  console.log('Started raffle: ', tx.hash)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
