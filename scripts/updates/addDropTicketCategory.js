
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

  
  let erc1155Marketplace = await ethers.getContractAt("ERC1155MarketplaceFacet", diamondAddress, signer)   
  let tx
  let receipt



  if (testing) {
    tx = await erc1155Marketplace.setERC1155Categories([{
       erc1155TokenAddress:"0xA02d547512Bb90002807499F05495Fe9C4C3943f",
       erc1155TypeId:6,
       category:3
    }])
    console.log('Adding category:', tx.hash)
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Adding category failed: ${tx.hash}`)
    }
    console.log('Adding categorysucceeded:', tx.hash)
  }
  else {
    tx = await erc1155Marketplace.populateTransaction.setERC1155Categories([{
      erc1155TokenAddress:"0xA02d547512Bb90002807499F05495Fe9C4C3943f",
      erc1155TypeId:6,
      category:3
    }])
    await sendToMultisig(process.env.DIAMOND_UPGRADER, signer, tx)
  }

 

 


}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
