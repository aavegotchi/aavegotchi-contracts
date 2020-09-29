/* global ethers */

const FacetCutAction = {
  Add: 0,
  Replace: 1,
  Remove: 2
}

// eslint-disable-next-line no-unused-vars
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

async function deployFacets (...facetNames) {
  console.log('--')
  const deployed = []
  for (const name of facetNames) {
    const facetFactory = await ethers.getContractFactory(name)
    console.log(`Deploying ${name}`)
    deployed.push([name, await facetFactory.deploy()])
  }
  for (const [name, deployedFactory] of deployed) {
    await deployedFactory.deployed()
    console.log('--')
    console.log(`${name} deployed: ${deployedFactory.address}`)
  }
  return deployed
}

async function deployDiamond (diamondName, owner, facets, ...otherArgs) {
  const diamondFactory = await ethers.getContractFactory(diamondName)
  const diamondCut = []
  console.log('--')
  console.log('Setting up diamondCut args')
  console.log('--')
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
  console.log('--')
  console.log(`Deploying ${diamondName}`)
  const deployedDiamond = await diamondFactory.deploy(
    owner,
    diamondCut,
    ...otherArgs
  )
  await deployedDiamond.deployed()
  console.log(`${diamondName} deployed: ${deployedDiamond.address}`)
  console.log('--')
  return deployedDiamond
}

function inFacets (selector, facets) {
  for (const facet of facets) {
    if (facet.functionSelectors.includes(selector)) {
      return true
    }
  }
  return false
}

async function upgradeDiamond ({
  diamondAddress,
  facetNames,
  selectorsToRemove = [],
  initFacetName = undefined,
  initArgs = undefined
}) {
  const diamondCutFacet = (
    await ethers.getContractFactory('DiamondCutFacet')
  ).attach(diamondAddress)
  const diamondLoupeFacet = (
    await ethers.getContractFactory('DiamondLoupeFacet')
  ).attach(diamondAddress)

  const diamondCut = []
  const existingFacets = await diamondLoupeFacet.facets()
  const undeployed = []
  const deployed = []
  for (const name of facetNames) {
    console.log(name)
    const facetFactory = await ethers.getContractFactory(name)
    undeployed.push([name, facetFactory])
  }

  if (selectorsToRemove && selectorsToRemove.length > 0) {
    // check if any selectorsToRemove are already gone
    for (const selector of selectorsToRemove) {
      if (!inFacets(selector, existingFacets)) {
        throw Error('Function selector to remove is already gone.')
      }
    }
    diamondCut.push([
      ethers.constants.AddressZeo,
      FacetCutAction.Remove,
      selectorsToRemove
    ])
  }

  for (const [name, facetFactory] of undeployed) {
    console.log(`Deploying ${name}`)
    deployed.push([name, await facetFactory.deploy()])
  }

  for (const [name, deployedFactory] of deployed) {
    await deployedFactory.deployed()
    console.log('--')
    console.log(`${name} deployed: ${deployedFactory.address}`)
    const add = []
    const replace = []
    for (const selector of getSelectors(deployedFactory)) {
      if (!inFacets(selector, existingFacets)) {
        add.push(selector)
      } else {
        replace.push(selector)
      }
    }
    if (add.length > 0) {
      diamondCut.push([deployedFactory.address, FacetCutAction.Add, add])
    }
    if (replace.length > 0) {
      diamondCut.push([
        deployedFactory.address,
        FacetCutAction.Replace,
        replace
      ])

      // diamondCut.push([deployedFactory.address, replace])
    }
  }
  console.log('diamondCut arg:')
  console.log(diamondCut)
  console.log('------')

  let initFacetAddress = ethers.constants.AddressZero
  let functionCall = '0x';
  if (initFacetName !== undefined) {
    let initFacet
    for (const [name, deployedFactory] of deployed) {
      if (name === initFacetName) {
        initFacet = deployedFactory
        break;
      }
    }
    if (!initFacet) {
      const InitFacet = await ethers.getContractFactory(initFacetName)
      initFacet = await InitFacet.deploy()
      await initFacet.deployed()
      console.log('Deployed init facet: ' + initFacet.address)
    } else {
      console.log('Using init facet: ' + initFacet.address)
    }
    functionCall = initFacet.interface.encodeFunctionData('init', initArgs)
    console.log('Function call: ')
    console.log(functionCall)
    initFacetAddress = initFacet.address
  }

  const result = await diamondCutFacet.diamondCut(
    diamondCut,
    initFacetAddress,
    functionCall
  )
  console.log('------')
  console.log('Upgrade transaction hash: ' + result.hash)
  return result
}

exports.FacetCutAction = FacetCutAction
exports.upgradeDiamond = upgradeDiamond
exports.getSelectors = getSelectors
exports.deployFacets = deployFacets
exports.deployDiamond = deployDiamond
exports.inFacets = inFacets
exports.upgradeDiamond = upgradeDiamond
