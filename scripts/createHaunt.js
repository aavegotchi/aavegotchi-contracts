/* global ethers hre */

async function main () {
  const aavegotchiDiamondAddress = ''
  const hauntSize = 100
  const price = ethers.utils.parseEther('100')
  const daoFacet = await ethers.getContractAt('DAOFacet', aavegotchiDiamondAddress)
  const tx = await daoFacet.createHaunt(hauntSize, price, '0x000000')
  const receipt = await tx.wait()
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
