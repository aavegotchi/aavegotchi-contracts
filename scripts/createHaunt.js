/* global ethers hre */

async function main () {
  const aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  const hauntSize = 10000
  const price = ethers.utils.parseEther('100')
  const daoFacet = await ethers.getContractAt('DAOFacet', aavegotchiDiamondAddress)
  const tx = await daoFacet.createHaunt(hauntSize, price, '0x000000', { gasLimit: 5000000 })
  const receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error creating haunt: ${tx.hash}`)
  }
  console.log('Haunt created:', tx.hash)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
