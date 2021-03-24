/* global ethers hre */
// AavegotchiDiamond on matic
// const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
// kovan
const diamondAddress = '0xd0576c4371bBb9e531700898760B0064237832Ee'
const newOwner = '0x94cb5C277FCC64C274Bd30847f0821077B231022'
// const newOwner = '0x02491D37984764d39b99e4077649dcD349221a62'

async function main (scriptName) {
  console.log('Transferring ownership of diamond: ' + diamondAddress)
  const diamond = await ethers.getContractAt('OwnershipFacet', diamondAddress)
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
