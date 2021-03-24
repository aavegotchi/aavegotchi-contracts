
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
  // const signer = new LedgerSigner(ethers.provider)
  // const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  // kovan
  const diamondAddress = '0xd0576c4371bBb9e531700898760B0064237832Ee'

  const Factory = await ethers.getContractFactory('SvgFacet')
  const facet = await Factory.deploy()
  await facet.deployed()
  console.log('Deployed facet:', facet.address)

  const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 }

  const newFuncs = [
    getSelector('function setSleeves(tuple(uint256 sleeveId, uint256 wearableId)[] calldata _sleeves) external'),
    getSelector('function updateSvg(string calldata _svg, tuple(bytes32 svgType, uint256[] ids, uint256[] sizes)[] calldata _typesAndIdsAndSizes) external')
  ]
  const existingSvgFacetFuncs = getSelectors(facet) // .filter(selector => !newFuncs.includes(selector))

  const cut = [
    {
      facetAddress: facet.address,
      action: FacetCutAction.Replace,
      functionSelectors: existingSvgFacetFuncs
    }
  ]
  console.log(cut)

  // const diamondCut = (await ethers.getContractAt('IDiamondCut', diamondAddress)).connect(signer)
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
