
/* global ethers hre */
/* eslint prefer-const: "off" */

const { LedgerSigner } = require('@ethersproject/hardware-wallets')
const { sendToMultisig } = require('../libraries/multisig/multisig')

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

  let itemManager;

  if (testing) {
itemManager = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
  }
  else {
itemManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119"
  }


  let itemManagers = [itemManager]
  console.log('Adding item managers')  

  if (testing) {
    tx = await daoFacet.addItemManagers(itemManagers)
    console.log('Adding item managers tx:', tx.hash)
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Adding item manager failed: ${tx.hash}`)
    }
    console.log('Adding item manager succeeded:', tx.hash)


    /*
    console.log('Updating dimensions')

    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: ["0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"]
    })

    signer = await ethers.provider.getSigner("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266")

    let svgFacet = await ethers.getContractAt("SvgFacet", diamondAddress, signer)  

    let dimensions = [30,38,34,23]
    await svgFacet.setItemsDimensions(["156"],[dimensions])

    

    console.log('Dimensions updated')

    const gotchi = await svgFacet.getAavegotchiSvg("4441")
    console.log('output:',gotchi)
    */

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
