/* global ethers hre */
/* eslint-disable  prefer-const */

const { LedgerSigner } = require('@ethersproject/hardware-wallets')

const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
const newGameManager = '0x027Ffd3c119567e85998f4E6B9c3d83D5702660c'

async function main () {
  let owner = await (await ethers.getContractAt('OwnershipFacet', diamondAddress)).owner()
  console.log(owner)
  let signer
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
  console.log('Setting game manager.')
  const daoFacet = (await ethers.getContractAt('DAOFacet', diamondAddress)).connect(signer)
  const tx = await daoFacet.setGameManager(newGameManager)
  console.log('Transaction hash: ' + tx.hash)
  let receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`)
  }
  console.log('Transaction complete')

  const gameManager = await daoFacet.gameManager()
  console.log('Game manager:', gameManager)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
