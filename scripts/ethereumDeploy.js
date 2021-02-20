/* global ethers hre */

const diamond = require('../js/diamond-util/src/index.js')

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
  let rootChainManager

  if (hre.network.name === 'hardhat') {
    rootChainManager = account
  } else if (hre.network.name === 'mainnet') {
    rootChainManager = '0xA0c68C638235ee32657e8f720a23ceC1bFc77C7'
  } else if (hre.network.name === 'kovan') {
    rootChainManager = account
  } else if (hre.network.name === 'gorli') {
    rootChainManager = '0xBbD7cBFA79faee899Eaf900F13C9065bF03B1A74'
    // rootChainManager = account
  } else if (hre.network.name === 'mumbai') {

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
    aavegotchiFacet,
    itemsFacet,
    bridgeFacet
  ] = await deployFacets(
    'contracts/Ethereum/facets/AavegotchiFacet.sol:AavegotchiFacet',
    'contracts/Ethereum/facets/ItemsFacet.sol:ItemsFacet',
    'contracts/Ethereum/facets/BridgeFacet.sol:BridgeFacet'
  )

  // eslint-disable-next-line no-unused-vars
  const aavegotchiDiamond = await diamond.deploy({
    diamondName: 'AavegotchiDiamond',
    initDiamond: 'contracts/Ethereum/InitDiamond.sol:InitDiamond',
    facets: [
      ['AavegotchiFacet', aavegotchiFacet],
      ['ItemsFacet', itemsFacet],
      ['BridgeFacet', bridgeFacet]
    ],
    owner: account,
    args: [rootChainManager],
    txArgs: { gasLimit: 5000000 }
  })
  console.log('Aavegotchi diamond address:' + aavegotchiDiamond.address)

  tx = aavegotchiDiamond.deployTransaction
  receipt = await tx.wait()
  console.log('Aavegotchi diamond deploy gas used:' + strDisplay(receipt.gasUsed))
  totalGasUsed = totalGasUsed.add(receipt.gasUsed)

  const diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', aavegotchiDiamond.address)
  aavegotchiFacet = await ethers.getContractAt('contracts/Ethereum/facets/AavegotchiFacet.sol:AavegotchiFacet', aavegotchiDiamond.address)
  bridgeFacet = await ethers.getContractAt('contracts/Ethereum/facets/BridgeFacet.sol:BridgeFacet', aavegotchiDiamond.address)

  console.log('Total gas used: ' + strDisplay(totalGasUsed))
  return {
    account: account,
    aavegotchiDiamond: aavegotchiDiamond,
    diamondLoupeFacet: diamondLoupeFacet,
    itemsFacet: itemsFacet,
    aavegotchiFacet: aavegotchiFacet,
    bridgeFacet: bridgeFacet
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

/// deployed to gorli here:  0xfb6aCD41431D6a9E8b55DB167df354A08BDE2Da2
