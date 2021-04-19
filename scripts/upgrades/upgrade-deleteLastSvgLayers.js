
/* global ethers hre */
/* eslint prefer-const: "off" */

const { LedgerSigner } = require('@ethersproject/hardware-wallets')

const { sendToMultisig } = require('../libraries/multisig/multisig.js')

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
  let owner = await (await ethers.getContractAt('OwnershipFacet', diamondAddress)).owner()
  const testing = ['hardhat', 'localhost'].includes(hre.network.name)
  if (testing) {
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [owner]
    })
    signer = await ethers.provider.getSigner(owner)
  } else if (hre.network.name === 'matic') {
    signer = new LedgerSigner(ethers.provider)
  } else {
    throw Error('Incorrect network selected')
  }

  const Facet = await ethers.getContractFactory('SvgFacet')
  let facet = await Facet.deploy()
  await facet.deployed()
  console.log('Deployed facet:', facet.address)

  const newFuncs = [
    getSelector('function deleteLastSvgLayers(bytes32 _svgType, uint256 _numLayers) external')
  ]
  let existingFuncs = getSelectors(facet)
  for (const selector of newFuncs) {
    if (!existingFuncs.includes(selector)) {
      throw Error(`Selector ${selector} not found`)
    }
  }
  existingFuncs = existingFuncs.filter(selector => !newFuncs.includes(selector))

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
      functionSelectors: existingFuncs
    }
  ]
  console.log(cut)
  const diamondCut = await ethers.getContractAt('IDiamondCut', diamondAddress, signer)
  let tx
  let receipt

  if (testing) {
    console.log('Diamond cut')
    tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
    console.log('Diamond cut tx:', tx.hash)
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
    console.log('Completed diamond cut: ', tx.hash)

    console.log('Delete SVG layers')
    const svgFacet = await ethers.getContractAt('SvgFacet', diamondAddress, signer)

    tx = await svgFacet.deleteLastSvgLayers(ethers.utils.formatBytes32String('wearables'), 4, { gasLimit: 8000000 })
    console.log('Delete SVG layers tx:', tx.hash)
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Delete SVG layers failed: ${tx.hash}`)
    }
    console.log('Completed deleting SVG layers: ', tx.hash)
    let svgs = await svgFacet.getSvgs(ethers.utils.formatBytes32String('wearables'), [161])
    let count = 0
    for (const svg of svgs) {
      console.log(count)
      console.log(svg)
      count++
      console.log('  -   ')
    }
  } else {
    console.log('Diamond cut')
    tx = await diamondCut.populateTransaction.diamondCut(cut, ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
    await sendToMultisig(process.env.DIAMOND_UPGRADER, signer, tx)

    console.log('Sending delete SVG layers transaction')
    const svgFacet = await ethers.getContractAt('SvgFacet', diamondAddress, signer)

    tx = await svgFacet.populateTransaction.deleteLastSvgLayers(ethers.utils.formatBytes32String('wearables'), 4, { gasLimit: 800000 })
    await sendToMultisig(process.env.DIAMOND_UPGRADER, signer, tx)

    // let svgs = await svgFacet.getSvgs(ethers.utils.formatBytes32String('wearables'), [161, 162])
    // let count = 0
    // for (const svg of svgs) {
    //   console.log(count)
    //   console.log(svg)
    //   count++
    //   console.log('  -   ')
    // }
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
