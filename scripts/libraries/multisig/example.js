/* global ethers */
/* eslint-disable  prefer-const */
const { LedgerSigner } = require('@ethersproject/hardware-wallets')
const { sendToMultisig } = require('./multisig.js')

async function main () {
  let signer = new LedgerSigner(ethers.provider)

  const multisigAddress = process.env.DIAMOND_UPGRADER

  const quickAddress = '0x831753DD7087CaC61aB5644b308642cc1c33Dc13'
  const erc20 = await ethers.getContractAt('IERC20', quickAddress)
  let to = await signer.getAddress()

  let tx = await erc20.populateTransaction.transfer(to, ethers.utils.parseEther('0.0001'))
  await sendToMultisig(multisigAddress, signer, tx)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
