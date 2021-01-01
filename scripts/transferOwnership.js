/* global ethers hre */

const diamondAddress = '0xd94f3e6e026eeAf80AecD557c4a74faC4D46E8d7'
const newOwner = '0x94cb5C277FCC64C274Bd30847f0821077B231022'

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
