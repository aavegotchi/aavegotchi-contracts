/* global ethers hre */

// Here are the details for Polygon mainnet (let's see if we can make this name stick):
// VRF Coordinator: 0x3d2341ADb2D31f1c5530cDC622016af293177AE0
// LINK: 0xb0897686c545045aFc77CF20eC7A532E3120E0F1
// KeyHash: 0xf86195cf7690c55907b2b611ebb7343a6f649bff128701cc542f0569e2c549da
// Fee: 100000000000000 (0.0001 LINK)
// You can start using them now. Official announcement will be in 1-2 weeks.

import { ethers } from "hardhat";
import { gasPrice } from "./helperFunctions";

const diamond = require('../js/diamond-util/src/index.js')

function addCommas (nStr: string) {
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

function strDisplay (str: any) {
  return addCommas(str.toString())
}

async function main (scriptName?: any) {
  console.log('SCRIPT NAME:', scriptName)

  const accounts = await ethers.getSigners()
  const signer = accounts[0]
  const account = await accounts[0].getAddress()
  console.log('Account: ' + account)
  console.log('---')
  let tx
  let totalGasUsed = ethers.BigNumber.from('0')
  let receipt
  let vrfCoordinator
  let linkAddress
  let keyHash
  let fee
  let initialHauntSize
  let ghstTokenContract
  let dao
  let daoTreasury
  let rarityFarming
  let pixelCraft
  let childChainManager
  let itemManagers

  const portalPrice = ethers.utils.parseEther('100')
  const name = 'Aavegotchi'
  const symbol = 'GOTCHI'
  childChainManager = '0xb5505a6d998549090530911180f38aC5130101c6'
  vrfCoordinator = '0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9' // wrong one
  linkAddress = '0x326C977E6efc84E512bB9C30f76E30c160eD06FB'
  keyHash = '0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4' // wrong one
  fee = ethers.utils.parseEther('0.0001')

  initialHauntSize = '10000'
  itemManagers = [account] // 'todo'
  dao = account // 'todo' // await accounts[1].getAddress()
  daoTreasury = account
  rarityFarming = account // 'todo' // await accounts[2].getAddress()
  pixelCraft = account // 'todo' // await accounts[3].getAddress()

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

  async function deployFacets (...facets: any[]) {
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
    erc721MarketplaceFacet,
    gotchiLendingFacet,
    lendingGetterAndSetterFacet,
    svgViewsFacet,
    voucherMigrationFacet,
    whitelistFacet
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
    'ERC721MarketplaceFacet',
    'ERC1155MarketplaceFacet',
    'GotchiLendingFacet',
    'LendingGetterAndSetterFacet',
    'SvgViewsFacet',
    'VoucherMigrationFacet',
    'WhitelistFacet',
  )

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
      ['ERC721MarketplaceFacet', erc721MarketplaceFacet],
      ['GotchiLendingFacet', gotchiLendingFacet],
      ['LendingGetterAndSetterFacet', lendingGetterAndSetterFacet],
      ['SvgViewsFacet', svgViewsFacet],
      ['VoucherMigrationFacet', voucherMigrationFacet],
      ['WhitelistFacet', whitelistFacet],
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

  tx = await daoFacet.addItemManagers(itemManagers);
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log('Item managers added:' + strDisplay(receipt.gasUsed))
  totalGasUsed = totalGasUsed.add(receipt.gasUsed)

  // set marketplace categories for FAKE Gotchis
  console.log("Add categories for FAKE gotchis NFTs");

  let categories;
  erc721MarketplaceFacet = await ethers.getContractAt('ERC721MarketplaceFacet', aavegotchiDiamond.address, signer)
  categories = [
    {
      erc721TokenAddress: '0x330088c3372f4F78cF023DF16E1e1564109191dc',
      category: 5,
    },
  ];
  tx = await erc721MarketplaceFacet.setERC721Categories(categories, {
    gasPrice: gasPrice,
  });
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Not Sent: ${tx.hash}`);
  }
  console.log(`Added categories for FAKE gotchis NFTs gas used:` + strDisplay(receipt.gasUsed))
  totalGasUsed = totalGasUsed.add(receipt.gasUsed)
  console.log("Added categories for FAKE gotchis NFTs successfully");

  console.log("Add categories for FAKE gotchis cards");
  erc1155MarketplaceFacet = await ethers.getContractAt('ERC1155MarketplaceFacet', aavegotchiDiamond.address, signer)
  categories = [
    {
      erc1155TokenAddress: '0x9E282FE4a0be6A0C4B9f7d9fEF10547da35c52EA',
      erc1155TypeId: 0,
      category: 6,
    },
  ];
  tx = await erc1155MarketplaceFacet.setERC1155Categories(categories, {
    gasPrice: gasPrice,
  });
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Not Sent: ${tx.hash}`);
  }
  console.log(`Added categories for FAKE gotchis cards gas used:` + strDisplay(receipt.gasUsed))
  totalGasUsed = totalGasUsed.add(receipt.gasUsed)
  console.log("Added categories for FAKE gotchis cards successfully");
  console.log('Total gas used: ' + strDisplay(totalGasUsed))
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
