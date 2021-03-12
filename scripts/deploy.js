/* global ethers hre */

// Here are the details for Polygon mainnet (let's see if we can make this name stick):
// VRF Coordinator: 0x3d2341ADb2D31f1c5530cDC622016af293177AE0
// LINK: 0xb0897686c545045aFc77CF20eC7A532E3120E0F1
// KeyHash: 0xf86195cf7690c55907b2b611ebb7343a6f649bff128701cc542f0569e2c549da
// Fee: 100000000000000 (0.0001 LINK)
// You can start using them now. Official announcement will be in 1-2 weeks.

const diamond = require('../js/diamond-util/src/index.js')
const { aavegotchiSvgs } = require('../svgs/aavegotchi.js')
const { wearablesSvgs } = require('../svgs/wearables.js')
const { collateralsSvgs } = require('../svgs/collaterals.js')
const { eyeShapeSvgs } = require('../svgs/eyeShapes.js')
const { wearableSets } = require('./wearableSets.js')

function addCommas (nStr) {
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

function strDisplay (str) {
  return addCommas(str.toString())
}

async function main (scriptName) {
  console.log('SCRIPT NAME:', scriptName)

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
  let initialHauntSize
  let ghstTokenContract
  let dao
  let daoTreasury
  let rarityFarming
  let pixelCraft
  let childChainManager
  let ghstStakingDiamond
  const gasLimit = 12300000

  const portalPrice = ethers.utils.parseEther('100')
  const name = 'Aavegotchi'
  const symbol = 'GOTCHI'
  if (hre.network.name === 'hardhat') {
    childChainManager = account
    ghstStakingDiamond = account
    const LinkTokenMock = await ethers.getContractFactory('LinkTokenMock')
    linkContract = await LinkTokenMock.deploy()
    await linkContract.deployed()
    linkAddress = linkContract.address
    vrfCoordinator = account
    keyHash = '0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4'
    fee = ethers.utils.parseEther('0.0001')
    initialHauntSize = '100'

    // ghstTokenContract = set below
    dao = await accounts[1].getAddress()
    daoTreasury = await accounts[1].getAddress()
    rarityFarming = await accounts[2].getAddress()
    pixelCraft = await accounts[3].getAddress()
  } else if (hre.network.name === 'matic') {
    childChainManager = '0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa'
    vrfCoordinator = '0x3d2341ADb2D31f1c5530cDC622016af293177AE0'
    linkAddress = '0xb0897686c545045aFc77CF20eC7A532E3120E0F1'
    keyHash = '0xf86195cf7690c55907b2b611ebb7343a6f649bff128701cc542f0569e2c549da'
    fee = ethers.utils.parseEther('0.0001')
    initialHauntSize = '10000'

    // Matic ghst token address
    ghstTokenContract = await ethers.getContractAt('GHSTFacet', '0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7')

    ghstStakingDiamond = '0xA02d547512Bb90002807499F05495Fe9C4C3943f'

    dao = 'todo' // await accounts[1].getAddress()
    daoTreasury = 'todo'
    rarityFarming = 'todo' // await accounts[2].getAddress()
    pixelCraft = 'todo' // await accounts[3].getAddress()
  } else if (hre.network.name === 'kovan') {
    childChainManager = account
    vrfCoordinator = '0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9'
    linkAddress = '0xa36085F69e2889c224210F603D836748e7dC0088'
    keyHash = '0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4'
    fee = ethers.utils.parseEther('0.1')
    initialHauntSize = '10000'

    ghstTokenContract = await ethers.getContractAt('GHSTFacet', '0xeDaA788Ee96a0749a2De48738f5dF0AA88E99ab5')
    // console.log('GHST diamond address:' + ghstDiamond.address)

    ghstStakingDiamond = '0xA4fF399Aa1BB21aBdd3FC689f46CCE0729d58DEd'

    dao = account // 'todo' // await accounts[1].getAddress()
    daoTreasury = account
    rarityFarming = account // 'todo' // await accounts[2].getAddress()
    pixelCraft = account // 'todo' // await accounts[3].getAddress()
  } else if (hre.network.name === 'mumbai') {
    // childChainManager = '0xb5505a6d998549090530911180f38aC5130101c6'
    childChainManager = '0xb5505a6d998549090530911180f38aC5130101c6'
    vrfCoordinator = '0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9' // wrong one
    linkAddress = '0x326C977E6efc84E512bB9C30f76E30c160eD06FB'
    keyHash = '0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4' // wrong one
    fee = ethers.utils.parseEther('0.0001')

    initialHauntSize = '10000'

    // ghstTokenContract = await ethers.getContractAt('GHSTFacet', '0x658809Bb08595D15a59991d640Ed5f2c658eA284')
    ghstTokenContract = await ethers.getContractAt('GHSTFacet', '0x20d0A1ce31f8e8A77b291f25c5fbED007Adde932')

    ghstStakingDiamond = '0xA02d547512Bb90002807499F05495Fe9C4C3943f'
    // const GhstTokenContract = await ethers.getContractFactory('GHSTFacet')
    // ghstTokenContract = await GhstTokenContract.deploy()
    // await ghstTokenContract.deployed()
    // await ghstTokenContract.mintTo('0x0b22380B7c423470979AC3eD7d3c07696773dEa1')
    // console.log('GHSTToken:' + ghstTokenContract.address)
    // throw 'done here'

    dao = account // 'todo' // await accounts[1].getAddress()
    daoTreasury = account
    rarityFarming = account // 'todo' // await accounts[2].getAddress()
    pixelCraft = account // 'todo' // await accounts[3].getAddress()

    // console.log('GHST diamond address:' + ghstDiamond.address)
  } else {
    throw Error('No network settings for ' + hre.network.name)
  }

  async function deployFacets (...facets) {
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
    bridgeFacet,
    aavegotchiFacet,
    aavegotchiGameFacet,
    svgFacet,
    itemsFacet,
    itemsTransferFacet,
    collateralFacet,
    daoFacet,
    vrfFacet,
    shopFacet,
    metaTransactionsFacet,
    erc1155MarketplaceFacet,
    erc721MarketplaceFacet
  ] = await deployFacets(
    'contracts/Aavegotchi/facets/BridgeFacet.sol:BridgeFacet',
    'contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet',
    'AavegotchiGameFacet',
    'SvgFacet',
    'contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet',
    'ItemsTransferFacet',
    'CollateralFacet',
    'DAOFacet',
    'VrfFacet',
    'ShopFacet',
    'MetaTransactionsFacet',
    'ERC1155MarketplaceFacet',
    'ERC721MarketplaceFacet'
  )

  if (hre.network.name === 'hardhat') {
    ghstTokenContract = await diamond.deploy({
      diamondName: 'GHSTDiamond',
      initDiamond: 'contracts/GHST/InitDiamond.sol:InitDiamond',
      facets: [
        'GHSTFacet'
      ],
      owner: account
    })
    ghstTokenContract = await ethers.getContractAt('GHSTFacet', ghstTokenContract.address)
    console.log('GHST diamond address:' + ghstTokenContract.address)
  }

  // eslint-disable-next-line no-unused-vars
  const aavegotchiDiamond = await diamond.deploy({
    diamondName: 'AavegotchiDiamond',
    initDiamond: 'contracts/Aavegotchi/InitDiamond.sol:InitDiamond',
    facets: [
      ['BridgeFacet', bridgeFacet],
      ['AavegotchiFacet', aavegotchiFacet],
      ['AavegotchiGameFacet', aavegotchiGameFacet],
      ['SvgFacet', svgFacet],
      ['ItemsFacet', itemsFacet],
      ['ItemsTransferFacet', itemsTransferFacet],
      ['CollateralFacet', collateralFacet],
      ['DAOFacet', daoFacet],
      ['VrfFacet', vrfFacet],
      ['ShopFacet', shopFacet],
      ['MetaTransactionsFacet', metaTransactionsFacet],
      ['ERC1155MarketplaceFacet', erc1155MarketplaceFacet],
      ['ERC721MarketplaceFacet', erc721MarketplaceFacet]
    ],
    owner: account,
    args: [[dao, daoTreasury, pixelCraft, rarityFarming, ghstTokenContract.address, keyHash, fee, vrfCoordinator, linkAddress, childChainManager, name, symbol]]
  })
  console.log('Aavegotchi diamond address:' + aavegotchiDiamond.address)

  tx = aavegotchiDiamond.deployTransaction
  receipt = await tx.wait()
  console.log('Aavegotchi diamond deploy gas used:' + strDisplay(receipt.gasUsed))
  totalGasUsed = totalGasUsed.add(receipt.gasUsed)

  // create first haunt
  daoFacet = await ethers.getContractAt('DAOFacet', aavegotchiDiamond.address)
  tx = await daoFacet.createHaunt(initialHauntSize, portalPrice, '0x000000')
  receipt = await tx.wait()
  console.log('Haunt created:' + strDisplay(receipt.gasUsed))
  totalGasUsed = totalGasUsed.add(receipt.gasUsed)

  receipt = await tx.wait()
  console.log('Aavegotchi diamond deploy gas used:' + strDisplay(receipt.gasUsed))
  totalGasUsed = totalGasUsed.add(receipt.gasUsed)

  const diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', aavegotchiDiamond.address)
  vrfFacet = await ethers.getContractAt('VrfFacet', aavegotchiDiamond.address)
  aavegotchiFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet', aavegotchiDiamond.address)
  aavegotchiGameFacet = await ethers.getContractAt('AavegotchiGameFacet', aavegotchiDiamond.address)
  collateralFacet = await ethers.getContractAt('CollateralFacet', aavegotchiDiamond.address)
  shopFacet = await ethers.getContractAt('ShopFacet', aavegotchiDiamond.address)
  erc1155MarketplaceFacet = await ethers.getContractAt('ERC1155MarketplaceFacet', aavegotchiDiamond.address)
  erc721MarketplaceFacet = await ethers.getContractAt('ERC721MarketplaceFacet', aavegotchiDiamond.address)
  bridgeFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/BridgeFacet.sol:BridgeFacet', aavegotchiDiamond.address)

  // add collateral info

  console.log('Adding Collateral Types')

  if (hre.network.name === 'hardhat') {
    // const { getCollaterals } = require('./collateralTypes.js')
    const { getCollaterals } = require('./testCollateralTypes.js')
    tx = await daoFacet.addCollateralTypes(getCollaterals(hre.network.name, ghstTokenContract.address))
  } else if (hre.network.name === 'mumbai') {
    // const { getCollaterals } = require('./collateralTypes.js')
    const { getCollaterals } = require('./testCollateralTypes.js')
    tx = await daoFacet.addCollateralTypes(getCollaterals(hre.network.name, ghstTokenContract.address))
  } else {
    const { getCollaterals } = require('./collateralTypes.js')
    tx = await daoFacet.addCollateralTypes(getCollaterals(hre.network.name, ghstTokenContract.address))
  }
  receipt = await tx.wait()
  console.log('Adding Collateral Types gas used::' + strDisplay(receipt.gasUsed))
  totalGasUsed = totalGasUsed.add(receipt.gasUsed)

  console.log('Adding ticket categories')
  // adding type categories
  const ticketCategories = []
  for (let i = 0; i < 6; i++) {
    ticketCategories.push({
      erc1155TokenAddress: ghstStakingDiamond,
      erc1155TypeId: i,
      category: 3
    })
  }
  tx = await erc1155MarketplaceFacet.setERC1155Categories(ticketCategories, { gasLimit: gasLimit })
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`)
  }
  console.log('Adding ticket categories gas used::' + strDisplay(receipt.gasUsed))
  totalGasUsed = totalGasUsed.add(receipt.gasUsed)

  console.log('Adding Item Types')
  itemsFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet', aavegotchiDiamond.address)
  itemsTransferFacet = await ethers.getContractAt('ItemsTransferFacet', aavegotchiDiamond.address)

  const { itemTypes } = require('./itemTypes.js')

  tx = await daoFacet.addItemTypes(itemTypes.slice(0, itemTypes.length / 4), { gasLimit: gasLimit })
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`)
  }
  console.log('Adding Item Types gas used::' + strDisplay(receipt.gasUsed))
  totalGasUsed = totalGasUsed.add(receipt.gasUsed)

  tx = await daoFacet.addItemTypes(itemTypes.slice(itemTypes.length / 4, (itemTypes.length / 4) * 2), { gasLimit: gasLimit })
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`)
  }
  console.log('Adding Item Types gas used::' + strDisplay(receipt.gasUsed))
  totalGasUsed = totalGasUsed.add(receipt.gasUsed)

  tx = await daoFacet.addItemTypes(itemTypes.slice((itemTypes.length / 4) * 2, (itemTypes.length / 4) * 3), { gasLimit: gasLimit })
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`)
  }
  console.log('Adding Item Types gas used::' + strDisplay(receipt.gasUsed))
  totalGasUsed = totalGasUsed.add(receipt.gasUsed)

  tx = await daoFacet.addItemTypes(itemTypes.slice((itemTypes.length / 4) * 3), { gasLimit: gasLimit })
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`)
  }

  // add wearable types info
  console.log('Adding Wearable Sets')
  tx = await daoFacet.addWearableSets(wearableSets.slice(0, wearableSets.length / 2))
  receipt = await tx.wait()
  console.log('Adding Wearable Sets gas used::' + strDisplay(receipt.gasUsed))
  totalGasUsed = totalGasUsed.add(receipt.gasUsed)

  // add wearable types info
  console.log('Adding Wearable Sets')
  tx = await daoFacet.addWearableSets(wearableSets.slice(wearableSets.length / 2))
  receipt = await tx.wait()
  console.log('Adding Wearable Sets gas used::' + strDisplay(receipt.gasUsed))
  totalGasUsed = totalGasUsed.add(receipt.gasUsed)

  // ----------------------------------------------------------------
  // Upload Svg layers
  svgFacet = await ethers.getContractAt('SvgFacet', aavegotchiDiamond.address)

  function setupSvg (...svgData) {
    const svgTypesAndSizes = []
    const svgs = []
    for (const [svgType, svg] of svgData) {
      svgs.push(svg.join(''))
      svgTypesAndSizes.push([ethers.utils.formatBytes32String(svgType), svg.map(value => value.length)])
    }
    return [svgs.join(''), svgTypesAndSizes]
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
  console.log('Uploading Wearable Svgs')
  let svg, svgTypesAndSizes
  console.log('Number of wearables:' + wearablesSvgs.length)
  let svgItemsStart = 0
  let svgItemsEnd = 0
  while (true) {
    let itemsSize = 0
    while (true) {
      if (svgItemsEnd === wearablesSvgs.length) {
        break
      }
      itemsSize += wearablesSvgs[svgItemsEnd].length
      if (itemsSize > 24576) {
        break
      }
      svgItemsEnd++
    }
    ;[svg, svgTypesAndSizes] = setupSvg(
      ['wearables', wearablesSvgs.slice(svgItemsStart, svgItemsEnd)]
    )
    console.log(`Uploading ${svgItemsStart} to ${svgItemsEnd} wearable SVGs`)
    printSizeInfo(svgTypesAndSizes)
    tx = await svgFacet.storeSvg(svg, svgTypesAndSizes)
    receipt = await tx.wait()
    console.log('Gas used:' + strDisplay(receipt.gasUsed))
    console.log('-------------------------------------------')
    totalGasUsed = totalGasUsed.add(receipt.gasUsed)
    if (svgItemsEnd === wearablesSvgs.length) {
      break
    }
    svgItemsStart = svgItemsEnd
  }

  // --------------------------------
  console.log('Uploading aavegotchi SVGs')
  ;[svg, svgTypesAndSizes] = setupSvg(
    ['aavegotchi', aavegotchiSvgs]
  )
  printSizeInfo(svgTypesAndSizes)
  tx = await svgFacet.storeSvg(svg, svgTypesAndSizes)
  receipt = await tx.wait()
  console.log('Gas used:' + strDisplay(receipt.gasUsed))
  totalGasUsed = totalGasUsed.add(receipt.gasUsed)
  console.log('-------------------------------------------')

  console.log('Uploading collaterals and eyeShapes')
  ;[svg, svgTypesAndSizes] = setupSvg(
    ['collaterals', collateralsSvgs],
    ['eyeShapes', eyeShapeSvgs]
  )
  printSizeInfo(svgTypesAndSizes)
  tx = await svgFacet.storeSvg(svg, svgTypesAndSizes)
  console.log('Uploaded SVGs')
  receipt = await tx.wait()
  console.log('Gas used:' + strDisplay(receipt.gasUsed))
  totalGasUsed = totalGasUsed.add(receipt.gasUsed)
  console.log('-------------------------------------------')

  // // if (hre.network.name === 'matic') {
  //   // transfer ownership
  //   const newOwner = '0x94cb5C277FCC64C274Bd30847f0821077B231022'
  //   console.log('Transferring ownership of diamond: ' + aavegotchiDiamond.address)
  //   const diamond = await ethers.getContractAt('OwnershipFacet', aavegotchiDiamond.address)
  //   const tx = await diamond.transferOwnership(newOwner)
  //   console.log('Transaction hash: ' + tx.hash)
  //   receipt = await tx.wait()
  //   console.log('Transfer Transaction complete')
  //   console.log('Gas used:' + strDisplay(receipt.gasUsed))
  //   totalGasUsed = totalGasUsed.add(receipt.gasUsed)
  // // }

  console.log('Total gas used: ' + strDisplay(totalGasUsed))
  return {
    account: account,
    aavegotchiDiamond: aavegotchiDiamond,
    diamondLoupeFacet: diamondLoupeFacet,
    bridgeFacet: bridgeFacet,
    ghstTokenContract: ghstTokenContract,
    itemsFacet: itemsFacet,
    itemsTransferFacet: itemsTransferFacet,
    aavegotchiFacet: aavegotchiFacet,
    aavegotchiGameFacet: aavegotchiGameFacet,
    collateralFacet: collateralFacet,
    vrfFacet: vrfFacet,
    daoFacet: daoFacet,
    svgFacet: svgFacet,
    erc1155MarketplaceFacet: erc1155MarketplaceFacet,
    erc721MarketplaceFacet: erc721MarketplaceFacet,
    shopFacet: shopFacet,
    linkAddress: linkAddress,
    linkContract: linkContract
  }
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

// diamond address: 0x7560d1282A3316DE155452Af3ec248d05b8A8044
