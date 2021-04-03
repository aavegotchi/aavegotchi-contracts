/* global ethers hre */
/* eslint-disable  prefer-const */

const { LedgerSigner } = require('@ethersproject/hardware-wallets')

async function main () {
  const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  let owner = await (await ethers.getContractAt('OwnershipFacet', diamondAddress)).owner()
  console.log(owner)
  let signer
  const testing = ['hardhat', 'localhost'].includes(hre.network.name)
  if (testing) {
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [owner]
    })
    signer = await ethers.provider.getSigner(owner)
  } else if (hre.network.name === 'matic') {
    signer = new LedgerSigner(ethers.provider)
  } else {
    throw Error('Incorrect network selected')
  }
  let tx
  let receipt
  let svgFacet = (await ethers.getContractAt('SvgFacet', diamondAddress)).connect(signer)
  let itemsFacet = (await ethers.getContractAt('contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet', diamondAddress)).connect(signer)
  let itemIds = [
    130, // fireball
    134, // L2 Sign
    137, // Vote sign
    148 // royal scepter

  ]
  let dimensions = [
    {
      x: 3,
      y: 31,
      width: 10,
      height: 12
    },
    {
      x: 1,
      y: 24,
      width: 13,
      height: 23
    },
    {
      x: 0,
      y: 24,
      width: 17,
      height: 23
    },
    {
      x: 5,
      y: 28,
      width: 6,
      height: 21
    }

  ]
  // let item = await itemsFacet.getItemType(130)
  // console.log(item)
  console.log('Set items dimensions')
  tx = await svgFacet.setItemsDimensions(itemIds, dimensions, { gasLimit: 5000000 })
  console.log('Setting SVG dimensions')
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error with transaction: ${tx.hash}`)
  }
  console.log('Transaction succcess:', tx.hash)

  console.log('Set L2 sign slot, handLeft which is aavegotchis right hand')
  tx = await itemsFacet.setWearableSlotPositions(134, [false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false], { gasLimit: 5000000 })
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error with transaction: ${tx.hash}`)
  }
  console.log('Transaction succcess:', tx.hash)

  console.log('Set Vote sign slot, handLeft which is aavegotchis right hand')
  tx = await itemsFacet.setWearableSlotPositions(137, [false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false], { gasLimit: 5000000 })
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error with transaction: ${tx.hash}`)
  }
  console.log('Transaction succcess:', tx.hash)

  // fireball
  // let aavegotchi = await svgFacet.getAavegotchiSvg(4005)

  // vote
  let aavegotchi = await svgFacet.getAavegotchiSvg(1412)
  console.log(aavegotchi)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
