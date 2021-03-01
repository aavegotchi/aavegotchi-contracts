/* global ethers */

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

function getSelector (func) {
  const abiInterface = new ethers.utils.Interface([func])
  return abiInterface.getSighash(ethers.utils.Fragment.from(func))
}

async function deployFacets (facetNames) {
  const facets = Object.create(null)
  for (const facetName of facetNames) {
    console.log('Deploying ', facetName)
    const factory = await ethers.getContractFactory(facetName)
    const facet = await factory.deploy()
    await facet.deployed()
    console.log('Deployed ' + facetName)
    facets[facetName] = facet
  }
  return facets
}

async function main () {
  // Buidler always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await bre.run('compile');

  const accounts = await ethers.getSigners()
  const account = await accounts[0].getAddress()
  console.log('Account: ' + account)
  console.log('---')

  const aavegotchiDiamondAddress = '0x228625D0d69a4399eB4DD40519731E96B9d4bc64'

  const facets = await deployFacets(['CollateralFacet'])

  const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 }
  const cut = [
    {
      facetAddress: facets.CollateralFacet.address,
      action: FacetCutAction.Replace,
      functionSelectors: getSelectors(facets.CollateralFacet)
    }
  ]
  console.log(cut)
  const diamondCut = await ethers.getContractAt('IDiamondCut', aavegotchiDiamondAddress)
  const tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, '0x', { gasLimit: 5000000 })
  console.log('Diamond cut tx:', tx.hash)
  const receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  console.log('Completed diamond cut: ', tx.hash)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
