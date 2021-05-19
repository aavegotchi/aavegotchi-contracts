
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


  let itemManagers = ["0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119"]
  console.log('Adding item managers')  

  if (testing) {
    tx = await daoFacet.addItemManagers(itemManagers)
    console.log('Adding item managers tx:', tx.hash)
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Adding item manager failed: ${tx.hash}`)
    }
    console.log('Adding item manager succeeded:', tx.hash)
  }
  else {
    tx = await daoFacet.populateTransaction.addItemManagers(itemManagers)
    await sendToMultisig(process.env.DIAMOND_UPGRADER, signer, tx)
  }

 

 


}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
