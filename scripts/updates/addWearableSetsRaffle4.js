
/* global ethers hre */
/* eslint prefer-const: "off" */

const {wearableSets} = require("./wearableSets/wearableSetsRaffle4.js")

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

  
  let daoFacet = await ethers.getContractAt("DAOFacet", diamondAddress, signer)   
  let tx
  let receipt

  console.log('Adding wearable sets')  
  tx = await daoFacet.addWearableSets(wearableSets)
  console.log('Adding wearable sets tx:', tx.hash)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Adding wearable sets failed: ${tx.hash}`)
  }
  console.log('Adding wearable sets succeeded:', tx.hash)

  let itemsFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet', diamondAddress)
  let sets = await itemsFacet.getWearableSets()
  for(const set of sets) {
    console.log(set)
  }

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
