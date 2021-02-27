/* global ethers hre */

const diamondAddress = '0x83692085F033eB333827BC16B47fcbfB46399aC1'
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
