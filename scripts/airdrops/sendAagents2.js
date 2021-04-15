
/* global ethers hre */
/* eslint prefer-const: "off" */

const { LedgerSigner } = require('@ethersproject/hardware-wallets')

async function main () {
  const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'

  const owner = await (await ethers.getContractAt('OwnershipFacet', diamondAddress)).owner()
  // console.log(owner)
  let signer

  const testing = ['hardhat', 'localhost'].includes(hre.network.name)
  if (testing) {
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [owner]
    })
    signer = await ethers.getSigner(owner)
  } else if (hre.network.name === 'matic') {
    signer = new LedgerSigner(ethers.provider)
  } else {
    throw Error('Incorrect network selected')
  }

  // miaList
  const miaList = ['0xedfb7bbBb0bc31C4D3DB77F6A56FE2E414A9bE63',
    '0x999C7997864b9bA4bAE06EBc0Aa59Cae1c91eD0e',
    '0xd16bddE3c4388E90E3f640896c9B92f28A71bF08',
    '0x75CFbc49986b7137d6a6df6C584f49510a2C756e',
    '0xf84835Af6A324F73c9102a889513B56dE36Fb43a',
    '0x1A760e3A431c8B9C075eD1280C8835a1a0F1651b',
    '0x45F7c1B3E66E5936bFd3834Effed93c82d8d069C',
    '0x65F9DeaCd2eb34ea0e86BE918F922eD5fCab75A0',
    '0x6fF1497328dCeCD7B2D26E80353cfA8f240dCF1a',
    '0xBcE3BD3b206946AbBe094903Ae2B4244B52fb4e9',
    '0x59c3D7966837E8C6B96251b6Ea0eF2cD4b17015C',
    '0x67023130eaAb2969E26e5a25E2AbF901C01bCDA0',
    '0x72C74e48bD7d4e28DEf498A5DFa737Ff33Cb5317',
    '0xdbd1ef4ab7aef97f0b2f7e58d41df5eecd059574']

  const quantities = [1, 1, 1, 1, 1]
  const fullsets = [55, 56, 57, 58, 59]

  const dao = (await ethers.getContractAt('DAOFacet', diamondAddress)).connect(signer)
  // const itemsFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet', diamondAddress)

  // for (const item of await itemsFacet.getItemTypes(fullsets)) {
  //   console.log(item.name)
  //   const currentItemMaxStr = (item.maxQuantity.toString())
  //   console.log(currentItemMaxStr)
  //   console.log(item.totalQuantity.toString())
  //   console.log('---')
  //   // newItemMaxQuantity = Number(currentItemMaxStr) + amountToSend
  // }

  const newItemMaxQuantityArray = new Array(fullsets.length).fill(294 + miaList.length)

  let tx
  let receipt
  console.log('Update ItemTypeMaxQuantities')
  tx = await dao.updateItemTypeMaxQuantity(fullsets, newItemMaxQuantityArray)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Not Sent: ${tx.hash}`)
  }
  console.log('Updated ItemTypeMaxQuantities successfully')

  for (let i = 0; i < miaList.length; i++) {
    tx = await dao.mintItems(miaList[i], fullsets, quantities)
    const receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Not Sent: ${tx.hash}`)
    }
    console.log(i, 'Minted items', fullsets, 'and sent to', miaList[i], 'at txn', tx.hash)
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
