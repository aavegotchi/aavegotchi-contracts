
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

async function main () {
  const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'

  const Factory = await ethers.getContractFactory('VoucherMigrationFacet')
  const facet = await Factory.deploy()
  await facet.deployed()
  console.log('Deployed facet:', facet.address)

  const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 }


  const cut = [
    {
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet)
    }
  ]

  const diamondCut = await ethers.getContractAt('IDiamondCut', diamondAddress)
  const tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, '0x', { gasLimit: 5000000 })
  console.log('Diamond cut tx:', tx.hash)
  const receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  console.log('Completed diamond cut: ', tx.hash)
}

// Deployed stkGHSTUSDC: 0x04439eC4ba8b09acfae0E9b5D75A82cC63b19f09
// Deployed new StakingFacet: 0xc87f3dC7c12F090617112D3892eC284483D8B633

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
