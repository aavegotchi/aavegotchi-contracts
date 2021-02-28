
/* global ethers */

async function main () {
  // const abi = ['function depositFor(address user, address rootToken, bytes calldata depositData) external']
  // const diamondAddress = 'the address'
  // const rootChainManagerAddress = '0xA0c68C638235ee32657e8f720a23ceC1bFc77C77'
  // const user = 'the address'

  // const rootChainManager = await ethers.getContractAt(abi, rootChainManagerAddress)

  // const tokenIds = [1, 2, 3, 4, 5, 6]
  // const tokenIdsBytes = ethers.utils.defaultAbiCoder.encode(['uint256[]'], [tokenIds])
  // const depositData = ethers.utils.defaultAbiCoder.encode(['uint256', 'bytes'], [721, tokenIdsBytes])
  // const tx = await rootChainManager.depositFor(user, diamondAddress, depositData)
  // const receipt = await tx.wait()
  // if (receipt.status) {
  //   console.log('Depoist successful')
  // } else {
  //   console.log('Deposit Failed')
  // }

  const abi = ['function depositFor(address user, address rootToken, bytes calldata depositData) external']
  const diamondAddress = 'the address'
  const rootChainManagerAddress = '0xA0c68C638235ee32657e8f720a23ceC1bFc77C77'
  const user = 'the address'

  const rootChainManager = await ethers.getContractAt(abi, rootChainManagerAddress)

  const itemTypes = [1, 2, 3, 4, 5, 6]
  const itemAmounts = [100, 35, 78, 3, 99, 2000]
  const itemBytes = ethers.utils.defaultAbiCoder.encode(['uint256[]', 'uint256[]'], [itemTypes, itemAmounts])
  const depositData = ethers.utils.defaultAbiCoder.encode(['uint256', 'bytes'], [1155, itemBytes])
  const tx = await rootChainManager.depositFor(user, diamondAddress, depositData)
  const receipt = await tx.wait()
  if (receipt.status) {
    console.log('Depoist successful')
  } else {
    console.log('Deposit Failed')
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

// gorli: 0x6c1fc89903d13EA41a5571751aD21973dB45c9e7
