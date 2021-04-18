/* global ethers hre */
// AavegotchiDiamond on matic
const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
// kovan
// const diamondAddress = '0xd0576c4371bBb9e531700898760B0064237832Ee'
const newOwner = '0x35FE3dF776474a7B24B3B1EC6e745a830FdAd351'
// const newOwner = '0x02491D37984764d39b99e4077649dcD349221a62'

const { LedgerSigner } = require('@ethersproject/hardware-wallets')

async function main (scriptName) {
  signer = new LedgerSigner(ethers.provider)
  console.log('Transferring ownership of diamond: ' + diamondAddress)
  const diamond = await ethers.getContractAt('OwnershipFacet', diamondAddress, signer)
  const tx = await diamond.transferOwnership(newOwner)
  console.log('Transaction hash: ' + tx.hash)
  await tx.wait()
  console.log('Transaction complete')
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
