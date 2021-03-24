
/* global ethers */
/* eslint prefer-const: "off" */

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
  let tx
  let receipt
  const signer = new LedgerSigner(ethers.provider)
  // const signer = (await ethers.getSigners())[0]

  const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  // kovan
  // const diamondAddress = '0xd0576c4371bBb9e531700898760B0064237832Ee'

  let svgFacet = (await ethers.getContractAt('SvgFacet', diamondAddress)).connect(signer)

  const itemIds = [
    50 // gldnxross
  ]
  const dimensions = [
    { x: 10, y: 32, width: 44, height: 24 } // gldnxross
  ]
  console.log('Set item dimensions')
  tx = await svgFacet.setItemsDimensions(itemIds, dimensions)
  console.log('Setting SVG dimensions')
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error with transaction: ${tx.hash}`)
  }
  console.log('Transaction succcess:', tx.hash)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
