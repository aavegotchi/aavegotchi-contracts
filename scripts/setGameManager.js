/* global ethers hre */
/* eslint-disable  prefer-const */

const { LedgerSigner } = require('@ethersproject/hardware-wallets')
const { sendToMultisig } = require('./libraries/multisig/multisig.js')

const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'

async function main () {
  let signer
  const testing = ['hardhat', 'localhost'].includes(hre.network.name)
  if (testing) {
    const owner = await (await ethers.getContractAt('OwnershipFacet', diamondAddress)).owner()
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
  console.log('Setting game manager.')
  const daoFacet = await ethers.getContractAt('DAOFacet', diamondAddress, signer)
  if (testing) {
    const tx = await daoFacet.setGameManager(process.env.NEW_GAME_MANAGER)
    console.log('Transaction hash: ' + tx.hash)
    let receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`)
    }
    console.log('Transaction complete')

    // test by getting the gameManager and seeing it
    const gameManager = await daoFacet.gameManager()
    console.log('Game manager:', gameManager)
  } else {
    let tx = await daoFacet.populateTransaction.setGameManager(process.env.NEW_GAME_MANAGER)
    await sendToMultisig(process.env.DIAMOND_UPGRADER, signer, tx)
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
