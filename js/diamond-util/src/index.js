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

async function deployFacets (facets) {
  console.log('--')
  const deployed = []
  for (const facet of facets) {
    if (Array.isArray(facet)) {
      if (typeof facet[0] !== 'string') {
        throw Error(`Error using facet: facet name must be a string. Bad input: ${facet[0]}`)
      }
      if (!(facet[1] instanceof ethers.Contract)) {
        throw Error(`Error using facet: facet must be a Contract. Bad input: ${facet[1]}`)
      }
      console.log(`Using already deployed ${facet[0]}: ${facet[1].address}`)
      console.log('--')
      deployed.push(facet)
    } else {
      if (typeof facet !== 'string') {
        throw Error(`Error deploying facet: facet name must be a string. Bad input: ${facet}`)
      }
      const facetFactory = await ethers.getContractFactory(facet)
      console.log(`Deploying ${facet}`)
      const deployedFactory = await facetFactory.deploy()
      await deployedFactory.deployed()
      console.log(`${facet} deployed: ${deployedFactory.address}`)
      console.log('--')
      deployed.push([facet, deployedFactory])
    }
  }
  return deployed
}

async function deploy ({
  diamondName,
  initDiamond,
  facets,
  diamondConstructorFacets,
  owner,
  args = [],
  txArgs = {}
}) {
  if (arguments.length !== 1) {
    throw Error(`Requires only 1 map argument. ${arguments.length} arguments used.`)
  }

  facets = await deployFacets(facets)

  const diamondFactory = await ethers.getContractFactory('Diamond')
  const diamondCut = []
  console.log('--')
  console.log('Setting up diamondCut args')
  console.log('--')
  
  for (const [name, deployedFacet] of facets) {
    // console.log(name)
    // console.log(getSignatures(deployedFacet))
    // console.log('--')
    diamondCut.push([
      deployedFacet.address,
      FacetCutAction.Add,
      getSelectors(deployedFacet)
    ])
  }
  console.log('--')

  let result
  if (typeof initDiamond === 'string') {
    const initDiamondName = initDiamond
    console.log(`Deploying ${initDiamondName}...`)

    initDiamond = await ethers.getContractFactory(initDiamond)
    initDiamond = await initDiamond.deploy()
    await initDiamond.deployed()

    result = await initDiamond.deployTransaction.wait()
    if (!result.status) {
      throw (Error(`Deploying ${initDiamondName} TRANSACTION FAILED!!! -------------------------------------------`))
    }
  }

  console.log('Encoding diamondCut init function call')
  const functionCall = initDiamond.interface.encodeFunctionData('init', args)
  // let functionCall
  // if (args.length > 0) {
  //   functionCall = initDiamond.interface.encodeFunctionData("init", ...args)
  // } else {
  //   functionCall = initDiamond.interface.encodeFunctionData()
  // }

  console.log(`Deploying ${diamondName}...`)

  const deployedDiamond = await diamondFactory.deploy(owner, diamondConstructorFacets[0], diamondConstructorFacets[1], diamondConstructorFacets[2])
  await deployedDiamond.deployed()

  result = await deployedDiamond.deployTransaction.wait()
  if (!result.status) {
    console.log('Deploying diamond TRANSACTION FAILED!!! -------------------------------------------')
    console.log('See block explorer app for details.')
    console.log('Transaction hash:' + deployedDiamond.deployTransaction.hash)
    throw (Error('failed to deploy diamond'))
  }
  console.log('Diamond deploy transaction hash:' + deployedDiamond.deployTransaction.hash)

  console.log(`${diamondName} deployed: ${deployedDiamond.address}`)
  console.log(`Diamond owner: ${owner}`)

  const diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', deployedDiamond.address)
  const tx = await diamondCutFacet.diamondCut(diamondCut, initDiamond.address, functionCall, txArgs)

  // console.log(`${diamondName} diamondCut arguments:`)
  // console.log(JSON.stringify([facets, initDiamond.address, args], null, 4))
  result = await tx.wait()
  if (!result.status) {
    console.log('TRANSACTION FAILED!!! -------------------------------------------')
    console.log('See block explorer app for details.')
  }
  console.log('DiamondCut success!')
  console.log('Transaction hash:' + tx.hash)
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

async function upgrade ({
  diamondAddress,
  diamondCut,
  txArgs = {},
  initFacetName = undefined,
  initArgs
}) {
  if (arguments.length !== 1) {
    throw Error(`Requires only 1 map argument. ${arguments.length} arguments used.`)
  }
  const diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress)
  const diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)
  const existingFacets = await diamondLoupeFacet.facets()
  const facetFactories = new Map()

  console.log('Facet Signatures and Selectors: ')
  for (const facet of diamondCut) {
    const functions = new Map()
    const selectors = []
    console.log('Facet: ' + facet)
    let facetName
    let contract
    if (Array.isArray(facet[0])) {
      facetName = facet[0][0]
      contract = facet[0][1]
      if (!(typeof facetName === 'string')) {
        throw Error('First value in facet[0] array must be a string.')
      }
      if (!(contract instanceof ethers.Contract)) {
        throw Error('Second value in facet[0] array must be a Contract object.')
      }
      facet[0] = facetName
    } else {
      facetName = facet[0]
      if (!(typeof facetName === 'string') && facetName) {
        throw Error('facet[0] must be a string or an array or false.')
      }
    }
    for (const signature of facet[2]) {
      const selector = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(signature)).slice(0, 10)
      console.log(`Function: ${selector} ${signature}`)
      selectors.push(selector)
      functions.set(selector, signature)
    }
    console.log('')
    if (facet[1] === FacetCutAction.Remove) {
      if (facetName) {
        throw (Error(`Can't remove functions because facet name must have a false value not ${facetName}.`))
      }
      facet[0] = ethers.constants.AddressZero
      for (const selector of selectors) {
        if (!inFacets(selector, existingFacets)) {
          const signature = functions.get(selector)
          throw Error(`Can't remove '${signature}'. It doesn't exist in deployed diamond.`)
        }
      }
      facet[2] = selectors
    } else if (facet[1] === FacetCutAction.Replace) {
      let facetFactory = facetFactories.get(facetName)
      if (!facetFactory) {
        if (contract) {
          facetFactories.set(facetName, contract)
        } else {
          facetFactory = await ethers.getContractFactory(facetName)
          facetFactories.set(facetName, facetFactory)
        }
      }
      for (const signature of facet[2]) {
        if (!Object.prototype.hasOwnProperty.call(facetFactory.interface.functions, signature)) {
          throw (Error(`Can't replace '${signature}'. It doesn't exist in ${facetName} source code.`))
        }
      }
      for (const selector of selectors) {
        if (!inFacets(selector, existingFacets)) {
          const signature = functions.get(selector)
          throw Error(`Can't replace '${signature}'. It doesn't exist in deployed diamond.`)
        }
      }
      facet[2] = selectors
    } else if (facet[1] === FacetCutAction.Add) {
      let facetFactory = facetFactories.get(facetName)
      if (!facetFactory) {
        if (contract) {
          facetFactories.set(facetName, contract)
        } else {
          facetFactory = await ethers.getContractFactory(facetName)
          facetFactories.set(facetName, facetFactory)
        }
      }
      for (const signature of facet[2]) {
        if (!Object.prototype.hasOwnProperty.call(facetFactory.interface.functions, signature)) {
          throw (Error(`Can't add ${signature}. It doesn't exist in ${facetName} source code.`))
        }
      }
      for (const selector of selectors) {
        if (inFacets(selector, existingFacets)) {
          const signature = functions.get(selector)
          throw Error(`Can't add '${signature}'. It already exists in deployed diamond.`)
        }
      }
      facet[2] = selectors
    } else {
      throw (Error('Incorrect FacetCutAction value. Must be 0, 1 or 2. Value used: ' + facet[1]))
    }
  }
  // deploying new facets
  const alreadDeployed = new Map()
  for (const facet of diamondCut) {
    if (facet[1] !== FacetCutAction.Remove) {
      const existingAddress = alreadDeployed.get(facet[0])
      if (existingAddress) {
        facet[0] = existingAddress
        continue
      }
      console.log(`Deploying ${facet[0]}`)
      const facetFactory = facetFactories.get(facet[0])
      let deployedFacet = facetFactory
      if (!(deployedFacet instanceof ethers.Contract)) {
        deployedFacet = await facetFactory.deploy()
        await deployedFacet.deployed()
      }
      facetFactories.set(facet[0], deployedFacet)
      console.log(`${facet[0]} deployed: ${deployedFacet.address}`)
      alreadDeployed.set(facet[0], deployedFacet.address)
      facet[0] = deployedFacet.address
    }
  }

  console.log('diamondCut arg:')
  console.log(diamondCut)

  let initFacetAddress = ethers.constants.AddressZero
  let functionCall = '0x'
  if (initFacetName !== undefined) {
    let initFacet = facetFactories.get(initFacetName)
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
    functionCall,
    txArgs
  )
  const receipt = await result.wait()
  if (!receipt.status) {
    console.log('TRANSACTION FAILED!!! -------------------------------------------')
    console.log('See block explorer app for details.')
  }
  console.log('------')
  console.log('Upgrade transaction hash: ' + result.hash)
  return result
}

async function upgradeWithNewFacets ({
  diamondAddress,
  facetNames,
  selectorsToRemove = [],
  initFacetName = undefined,
  initArgs = []
}) {
  if (arguments.length === 1) {
    throw Error(`Requires only 1 map argument. ${arguments.length} arguments used.`)
  }
  const diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress)
  const diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)

  const diamondCut = []
  const existingFacets = await diamondLoupeFacet.facets()
  const undeployed = []
  const deployed = []
  for (const name of facetNames) {
    console.log(name)
    const facetFactory = await ethers.getContractFactory(name)
    undeployed.push([name, facetFactory])
  }

  if (selectorsToRemove.length > 0) {
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
    }
  }
  console.log('diamondCut arg:')
  console.log(diamondCut)
  console.log('------')

  let initFacetAddress = ethers.constants.AddressZero
  let functionCall = '0x'
  if (initFacetName !== undefined) {
    let initFacet
    for (const [name, deployedFactory] of deployed) {
      if (name === initFacetName) {
        initFacet = deployedFactory
        break
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
exports.upgrade = upgrade
exports.upgradeWithNewFacets = upgradeWithNewFacets
exports.getSelectors = getSelectors
exports.deployFacets = deployFacets
exports.deploy = deploy
exports.inFacets = inFacets
exports.upgrade = upgrade
