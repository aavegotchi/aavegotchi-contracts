
/* global ethers hre */
/* eslint prefer-const: "off" */

const { LedgerSigner } = require('@ethersproject/hardware-wallets')

const { sendToMultisig } = require('../libraries/multisig/multisig.js')

const { aavegotchiSvgs } = require('../../svgs/aavegotchi-side.js')

const {
  sideViewDimensions1,
  sideViewDimensions2,
  sideViewDimensions3,
  sideViewDimensions4,
  sideViewDimensions5,
  sideViewDimensions6,
  sideViewDimensions7,
  sideViewDimensions8
} = require('../../svgs/sideViewDimensions.js')


async function main () {
  console.log("Upload SVG Start");
  const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  let account1Signer
  let account1Address
  let signer
  let facet
  let owner = await (await ethers.getContractAt('OwnershipFacet', diamondAddress)).owner()
  const testing = ['hardhat', 'localhost'].includes(hre.network.name)
  if (testing) {
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [owner]
    })
    signer = await ethers.getSigner(owner)
    let dao = await ethers.getContractAt('DAOFacet', diamondAddress, signer)
    ;[account1Signer] = await ethers.getSigners()
    account1Address = await account1Signer.getAddress()
    let tx = await dao.addItemManagers([account1Address])
    let receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`)
    }
    console.log('assigned', account1Address, 'as item manager')
  } else if (hre.network.name === 'matic') {
    signer = new LedgerSigner(ethers.provider)
  } else {
    throw Error('Incorrect network selected')
  }

  let tx
  let receipt
  let itemSigner
  if (testing) {
    itemSigner = account1Signer
  } else {
    itemSigner = signer
  }

  const svgViewsFacet = await ethers.getContractAt('SvgViewsFacet', diamondAddress, itemSigner)

  // tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions1)
  // receipt = await tx.wait()
  // if (!receipt.status) {
  //   throw Error(`Error:: ${tx.hash}`)
  // }
  // console.log('Uploaded item side dimensions 1')

  // tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions2)
  // receipt = await tx.wait()
  // if (!receipt.status) {
  //   throw Error(`Error:: ${tx.hash}`)
  // }
  // console.log('Uploaded item side dimensions 2')

  // tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions3)
  // receipt = await tx.wait()
  // if (!receipt.status) {
  //   throw Error(`Error:: ${tx.hash}`)
  // }
  // console.log('Uploaded item side dimensions 3')

  tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions4)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`)
  }
  console.log('Uploaded item side dimensions 4')
  
  // tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions5)
  // receipt = await tx.wait()
  // if (!receipt.status) {
  //   throw Error(`Error:: ${tx.hash}`)
  // }
  // console.log('Uploaded item side dimensions 5')
  //
  // tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions6)
  // receipt = await tx.wait()
  // if (!receipt.status) {
  //   throw Error(`Error:: ${tx.hash}`)
  // }
  // console.log('Uploaded item side dimensions 6')
  //
  // tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions7)
  // receipt = await tx.wait()
  // if (!receipt.status) {
  //   throw Error(`Error:: ${tx.hash}`)
  // }
  // console.log('Uploaded item side dimensions 7')
  //
  // tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions8)
  // receipt = await tx.wait()
  // if (!receipt.status) {
  //   throw Error(`Error:: ${tx.hash}`)
  // }
  // console.log('Uploaded item side dimensions 8')


      // uint8 internal constant WEARABLE_SLOT_BODY = 0;
    // uint8 internal constant WEARABLE_SLOT_FACE = 1;
    // uint8 internal constant WEARABLE_SLOT_EYES = 2;
    // uint8 internal constant WEARABLE_SLOT_HEAD = 3;
    // RIGHT = 4;
    // LEFT = 5;
    // uint8 internal constant WEARABLE_SLOT_PET = 6;
    // uint8 internal constant WEARABLE_SLOT_BG = 7;

    // back x:12, y:32
    // side x:20, y:32

  const numTraits1 = [99, 99, 99, 99, 1, 1];
  const wearables1 = [160, 159, 0, 161, 158, 158, 156, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  const sidePreview = await svgViewsFacet.previewSideAavegotchi("1", "0xE0b22E0037B130A9F56bBb537684E6fA18192341", numTraits1, wearables1);
  console.log("Side Preview: ", sidePreview);
}


if(require.main === module){
    main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
  }

  exports.sideViewDimensionsUpdate = main;
