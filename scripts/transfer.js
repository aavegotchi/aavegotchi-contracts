/* global ethers hre */

const { LedgerSigner } = require('@ethersproject/hardware-wallets')

async function main () {
  const signer = new LedgerSigner(ethers.provider)
  console.log(await signer.getChainId())
  const usdcAddress = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
  // account 3
  const account3 = '0x84b5DC7713a139dbbC9648A3e198b155655936e5'
  const erc20 = (await ethers.getContractAt('IERC20', usdcAddress)).connect(signer)
  const tx = await erc20.transfer(account3, ethers.utils.parseUnits('0.1', 6))
  const receipt = await tx.wait()
  if (receipt.status) {
    console.log('Successful')
  } else {
    console.log('Failed')
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
