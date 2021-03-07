
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

  const AavegotchiFacet = await ethers.getContractFactory('contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet')
  const aavegotchiFacet = await AavegotchiFacet.deploy()
  await aavegotchiFacet.deployed()
  console.log('Deployed facet:', aavegotchiFacet.address)

  const ERC721MarketplaceFacet = await ethers.getContractFactory('ERC721MarketplaceFacet')
  const erc721MarketplaceFacet = await ERC721MarketplaceFacet.deploy()
  await erc721MarketplaceFacet.deployed()
  console.log('Deployed facet:', erc721MarketplaceFacet.address)

  const newFunc = getSelector('function cancelERC721Listings(uint256[] calldata _listingIds) external')
  const erc721MarketplaceSelectors = getSelectors(erc721MarketplaceFacet).filter(selector => selector !== newFunc)

  const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 }

  const cut = [
    {
      facetAddress: erc721MarketplaceFacet.address,
      action: FacetCutAction.Add,
      functionSelectors: [newFunc]
    },
    {
      facetAddress: aavegotchiFacet.address,
      action: FacetCutAction.Replace,
      functionSelectors: getSelectors(aavegotchiFacet)
    },
    {
      facetAddress: erc721MarketplaceFacet.address,
      action: FacetCutAction.Replace,
      functionSelectors: erc721MarketplaceSelectors
    }
  ]
  console.log(cut)
  // 0adfab17

  const diamondCut = await ethers.getContractAt('IDiamondCut', diamondAddress)
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
