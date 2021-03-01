/* global ethers hre */

async function main () {
  const aavegotchiDiamondAddress = '0x228625D0d69a4399eB4DD40519731E96B9d4bc64'
  const hauntSize = 100
  const price = ethers.utils.parseEther('0.0000000001')
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
