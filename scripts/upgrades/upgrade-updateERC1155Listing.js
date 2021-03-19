
/* global ethers */

const { LedgerSigner } = require('@ethersproject/hardware-wallets')

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
  const signer = new LedgerSigner(ethers.provider)
  const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'

  const ERC1155MarketplaceFacet = await ethers.getContractFactory('ERC1155MarketplaceFacet')
  const erc1155MarketplaceFacet = await ERC1155MarketplaceFacet.deploy()
  await erc1155MarketplaceFacet.deployed()
  console.log('Deployed facet:', erc1155MarketplaceFacet.address)

  const erc1155MarketplaceSelectors = getSelectors(erc1155MarketplaceFacet)

  const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 }

  const cut = [
    {
      facetAddress: erc1155MarketplaceFacet.address,
      action: FacetCutAction.Replace,
      functionSelectors: erc1155MarketplaceSelectors
    }
  ]
  console.log(cut)

  const diamondCut = (await ethers.getContractAt('IDiamondCut', diamondAddress)).connect(signer)
  const tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, '0x', { gasLimit: 5000000 })
  console.log('Diamond cut tx:', tx.hash)
  const receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  console.log('Completed diamond cut: ', tx.hash)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
