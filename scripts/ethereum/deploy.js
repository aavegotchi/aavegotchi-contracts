/* global ethers */
/* eslint prefer-const: "off" */

const { LedgerSigner } = require('@ethersproject/hardware-wallets')

const FacetCutAction = {
  Add: 0,
  Replace: 1,
  Remove: 2
}

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

function getSignatures (contract) {
  return Object.keys(contract.interface.functions)
}

function getSelectors (contract) {
  const signatures = Object.keys(contract.interface.functions)
  const selectors = signatures.reduce((acc, val) => {
    if (val !== 'init(bytes)') {
      acc.push(contract.interface.getSighash(val))
    }
    return acc
  }, [])
  return selectors
}

async function main (scriptName) {
  console.log('SCRIPT NAME:', scriptName)
  const signer = new LedgerSigner(ethers.provider)
  const signerAddress = await signer.getAddress()
  // const signerAddress = '0x02491D37984764d39b99e4077649dcD349221a62'
  console.log('Signer Address:', signerAddress)

  // let totalGasUsed = ethers.BigNumber.from('0')
  let receipt

  const rootChainManager = '0xA0c68C638235ee32657e8f720a23ceC1bFc77C77'

  // async function deployFacets (...facets) {
  //   const instances = []
  //   for (let facet of facets) {
  //     let constructorArgs = []
  //     if (Array.isArray(facet)) {
  //       ;[facet, constructorArgs] = facet
  //     }
  //     console.log('Deploying:', facet)
  //     const factory = (await ethers.getContractFactory(facet)).connect(signer)
  //     const facetInstance = await factory.deploy(...constructorArgs)
  //     await facetInstance.deployed()
  //     const tx = facetInstance.deployTransaction
  //     const receipt = await tx.wait()
  //     console.log(`${facet} address: ${facetInstance.address}`)
  //     console.log(`${facet} deploy gas used:` + strDisplay(receipt.gasUsed))
  //     totalGasUsed = totalGasUsed.add(receipt.gasUsed)
  //     instances.push([facet, facetInstance])
  //   }
  //   return instances
  // }
  // console.log('Deploy facets')
  // const facets = await deployFacets(
  //   'contracts/Ethereum/facets/AavegotchiFacet.sol:AavegotchiFacet',
  //   // 'contracts/Ethereum/facets/ItemsFacet.sol:ItemsFacet',
  //   'contracts/Ethereum/facets/BridgeFacet.sol:BridgeFacet'
  // )
  // console.log('Successfully deployed facets')

  // console.log('Deploying InitDiamond')
  // // const InitDiamond = (await ethers.getContractFactory('contracts/Ethereum/InitDiamond.sol:InitDiamond')).connect(signer)
  // const InitDiamond = (await ethers.getContractFactory('contracts/Ethereum/InitDiamond.sol:InitDiamond')).connect(signer)
  // const initDiamond = await InitDiamond.deploy()
  // await initDiamond.deployed()
  // receipt = await initDiamond.deployTransaction.wait()
  // if (!receipt.status) {
  //   throw (Error('Deploying InitDiamond TRANSACTION FAILED!!! -------------------------------------------'))
  // }
  // console.log('Deployed InitDiamond. Address: ', initDiamond.address)

  // console.log('Encoding diamondCut init function call')
  // const functionCall = initDiamond.interface.encodeFunctionData('init', [rootChainManager])

  const facets = [
    ['contracts/Ethereum/facets/AavegotchiFacet.sol:AavegotchiFacet',
      await ethers.getContractAt('contracts/Ethereum/facets/AavegotchiFacet.sol:AavegotchiFacet', '0xb7fd49c7b662B5135D1bB03b51FfC51a6b908230')],
    ['contracts/Ethereum/facets/BridgeFacet.sol:BridgeFacet',
      await ethers.getContractAt('contracts/Ethereum/facets/BridgeFacet.sol:BridgeFacet', '0xb81c32635524c24B02d8286B6Fc5157151e4c273')]
  ]

  const initDiamond = await ethers.getContractAt('contracts/Ethereum/InitDiamond.sol:InitDiamond', '0x8eD0e2DdD3e298E1497578C21f719428A3d93134')
  console.log('InitDiamond address:', initDiamond.address)
  console.log('Encoding diamondCut init function call')
  const functionCall = initDiamond.interface.encodeFunctionData('init', [rootChainManager])

  const diamondFactory = (await ethers.getContractFactory('Diamond')).connect(signer)

  console.log('Deploying Diamond with owner address:', signerAddress)
  const deployedDiamond = await diamondFactory.deploy(signerAddress, { gasLimit: 10000000 })
  await deployedDiamond.deployed()
  receipt = await deployedDiamond.deployTransaction.wait()
  if (!receipt.status) {
    console.log('Deploying diamond TRANSACTION FAILED!!! -------------------------------------------')
    console.log('See block explorer app for details.')
    console.log('Transaction hash:' + deployedDiamond.deployTransaction.hash)
    throw (Error('failed to deploy diamond'))
  }
  console.log('Diamond deploy transaction hash:' + deployedDiamond.deployTransaction.hash)

  console.log(`Diamond deployed: ${deployedDiamond.address}`)
  const owner = await (await ethers.getContractAt('OwnershipFacet', deployedDiamond.address)).owner()
  console.log('Diamond owner:', owner)

  const diamondCut = []
  console.log('Adding facets:')

  for (const [name, deployedFacet] of facets) {
    console.log(name)
    console.log(getSignatures(deployedFacet))
    console.log('--')
    diamondCut.push([
      deployedFacet.address,
      FacetCutAction.Add,
      getSelectors(deployedFacet)
    ])
  }

  const diamondCutFacet = (await ethers.getContractAt('DiamondCutFacet', deployedDiamond.address)).connect(signer)
  const tx = await diamondCutFacet.diamondCut(diamondCut, initDiamond.address, functionCall, { gasLimit: 5000000 })

  receipt = await tx.wait()
  if (!receipt.status) {
    console.log('TRANSACTION FAILED!!! -------------------------------------------')
    console.log('See block explorer app for details.')
  }
  console.log('DiamondCut success!')
  console.log('Transaction hash:' + tx.hash)
  console.log('--')

  const bridgeFacet = await ethers.getContractAt('contracts/Ethereum/facets/BridgeFacet.sol:BridgeFacet', deployedDiamond.address)
  const root = await bridgeFacet.rootChainManager()
  console.log('RootChainManagerProxy:', root)
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

/// deployed to gorli here:  0x514f64665331259529c3DCD46551bba70ABBE164
