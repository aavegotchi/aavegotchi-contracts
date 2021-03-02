/* global ethers hre */

async function main () {
  const aavegotchiDiamondAddress = '0x228625D0d69a4399eB4DD40519731E96B9d4bc64'
  const accounts = await ethers.getSigners()
  const currentAccount = await accounts[0].getAddress()

  const ghstToSpend = ethers.utils.parseEther('0.0000000005')
  const numberOfTimesToBuy = 10

  const erc20Abi = ['function approve(address _spender, uint256 _value) external returns (bool success)']
  const ghst = await ethers.getContractAt(erc20Abi, '0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7')
  const tx = await ghst.approve(aavegotchiDiamondAddress, ghstToSpend.mul(numberOfTimesToBuy))
  const receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error approving GHST token: ${tx.hash}`)
  }
  console.log('Approved GHST token')

  const abi = ['function xingyun(address _to, uint256 _ghst, bytes32 _hash) external']
  const xingyunFacet = await ethers.getContractAt(abi, aavegotchiDiamondAddress)

  const hash = ethers.utils.solidityKeccak256(
    ['address', 'uint256', 'address', 'string'],
    [currentAccount, ghstToSpend, currentAccount, 'gotchigang']
  )
  
  for (let i = 0; i < numberOfTimesToBuy; i++) {
    const tx = await xingyunFacet.xingyun(currentAccount, ghstToSpend, hash)
    const receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Error buying portals: ${tx.hash}`)
    }

    console.log('Bought portals:', tx.hash)
  }

  const aavegotchiAbi = ['function balanceOf(address _owner) external view returns (uint256 balance_)']
  const aavegotchiFacet = await ethers.getContractAt(aavegotchiAbi, aavegotchiDiamondAddress)
  const num = await aavegotchiFacet.balanceOf(currentAccount)
  console.log('Now have this many portals:', num.toString())
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
