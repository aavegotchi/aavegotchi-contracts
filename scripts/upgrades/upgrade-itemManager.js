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
  const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  let signer
  let facet
  let owner = await (await ethers.getContractAt('OwnershipFacet', diamondAddress)).owner()
  const testing = ['hardhat', 'localhost'].includes(hre.network.name)
  if (testing) {
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [owner]
    })
    signer = await ethers.getSigner(owner)
  } else if (hre.network.name === 'matic') {
    signer = new LedgerSigner(ethers.provider)
  } else {
    throw Error('Incorrect network selected')
  }

  const daoFacet = await ethers.getContractFactory('contracts/Aavegotchi/facets/DAOFacet.sol:DAOFacet')
  facet = await daoFacet.deploy()
  await facet.deployed()
  console.log('Deployed facet:', facet.address)

  const newFuncs = [
    getSelector('function addItemManager(address _newItemManager) external'),
    getSelector('function removeItemManager(address itemManager) external')
  ]
  const changedFuncs=[
    getSelector('function addItemTypes(ItemType[] memory _itemTypes) external'),
    getSelector('function addItemTypesAndSvgs(ItemType[] memory _itemTypes,string calldata _svg, LibSvg.SvgTypeAndSizes[] calldata _typesAndSizes ) external')
   ]

   let existingItemsFuncs = getSelectors(facet)

  existingItemsFuncs = existingItemsFuncs.filter(selector => !newFuncs.includes(selector))

  const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 }

  const cut = [
    {
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: newFuncs
    },
   
    {
      facetAddress: facet.address,
      action: FacetCutAction.Replace,
      functionSelectors: existingItemsFuncs,changedFuncs
    }
  ]
  console.log(cut)

  const diamondCut = (await ethers.getContractAt('IDiamondCut', diamondAddress)).connect(signer)
  let tx
  let receipt

  console.log('Diamond cut')
  tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, '0x', { gasLimit: 8000000 })
  console.log('Diamond cut tx:', tx.hash)
  receipt = await tx.wait()
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
