
/* global ethers hre */
/* eslint prefer-const: "off" */

const { LedgerSigner } = require('@ethersproject/hardware-wallets')

const { sendToMultisig } = require('../libraries/multisig/multisig.js')

const { aavegotchiSvgs } = require('../../svgs/aavegotchi-side.js')

const {
  collateralsLeftSvgs,
  collateralsRightSvgs
} = require('../../svgs/collaterals-sides.js')

const {
  eyeShapesLeftSvgs,
  eyeShapesRightSvgs
} = require('../../svgs/eyeShapes-sides.js')

const {
  wearablesLeftSvgs,
  wearablesRightSvgs,
  wearablesBackSvgs,
  wearablesLeftSleeveSvgs,
  wearablesRightSleeveSvgs,
  wearablesBackSleeveSvgs
} = require('../../svgs/wearables-sides.js')

const { sideViewDimensions1, sideViewDimensions2, sideViewDimensions3, sideViewDimensions4, sideViewDimensions5, sideViewDimensions6, sideViewDimensions7, sideViewDimensions8 } = require('../../svgs/sideViewDimensions.js')

function getSelectors (contract) {
  const signatures = Object.keys(contract.interface.functions)
  const selectors = signatures.reduce((acc, val) => {
    if (val !== 'init(bytes)') {
      acc.push(contract.interface.getSighash(val))
    }
    return acc
  }, [])
  return selectors
}

function getSelector (func) {
  const abiInterface = new ethers.utils.Interface([func])
  return abiInterface.getSighash(ethers.utils.Fragment.from(func))
}

async function main () {
  const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  const gasLimit = 9000000
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

  async function uploadSvgs (svgs, svgType, testing, uploadSigner) {
    console.log("***", svgType, "***");
    let svgFacet = await ethers.getContractAt('SvgFacet', diamondAddress, uploadSigner)
    function setupSvg (...svgData) {
      const svgTypesAndSizes = []
      const svgItems = []
      for (const [svgType, svg] of svgData) {
        svgItems.push(svg.join(''))
        svgTypesAndSizes.push([ethers.utils.formatBytes32String(svgType), svg.map(value => value.length)])
      }
      return [svgItems.join(''), svgTypesAndSizes]
    }

    // eslint-disable-next-line no-unused-vars
    function printSizeInfo (svgTypesAndSizes) {
      console.log('------------- SVG Size Info ---------------')
      let sizes = 0
      for (const [svgType, size] of svgTypesAndSizes) {
        console.log(ethers.utils.parseBytes32String(svgType) + ':' + size)
        for (const nextSize of size) {
          sizes += nextSize
        }
      }
      console.log('Total sizes:' + sizes)
    }

    console.log('Uploading ', svgs.length, ' svgs')
    let svg, svgTypesAndSizes
    console.log('Number of svg:' + svgs.length)
    let svgItemsStart = 0
    let svgItemsEnd = 0
    while (true) {
      let itemsSize = 0
      while (true) {
        if (svgItemsEnd === svgs.length) {
          break
        }
        itemsSize += svgs[svgItemsEnd].length
        if (itemsSize > 24576) {
          break
        }
        svgItemsEnd++
      }
      ;[svg, svgTypesAndSizes] = setupSvg(
        [svgType, svgs.slice(svgItemsStart, svgItemsEnd)]
      )
      console.log(`Uploading ${svgItemsStart} to ${svgItemsEnd} wearable SVGs`)
      printSizeInfo(svgTypesAndSizes)
      if (testing) {
        let tx = await svgFacet.storeSvg(svg, svgTypesAndSizes, { gasLimit: gasLimit })
        let receipt = await tx.wait()
        if (!receipt.status) {
          throw Error(`Error:: ${tx.hash}`)
        }
        console.log(svgItemsEnd, svg.length)
      } else {
        let tx = await svgFacet.populateTransaction.storeSvg(svg, svgTypesAndSizes)
        await sendToMultisig(process.env.DIAMOND_UPGRADER, signer, tx)
      }
      if (svgItemsEnd === svgs.length) {
        break
      }
      svgItemsStart = svgItemsEnd
    }
  }

  let tx
  let receipt
  // console.log(aavegotchiSvgs)
  let itemSigner
  if (testing) {
    itemSigner = account1Signer
  } else {
    itemSigner = signer
  }


  await uploadSvgs(aavegotchiSvgs.left, 'aavegotchi-left', testing, itemSigner)
  await uploadSvgs(aavegotchiSvgs.right, 'aavegotchi-right', testing, itemSigner)
  await uploadSvgs(aavegotchiSvgs.back, 'aavegotchi-back', testing, itemSigner)

  await uploadSvgs(wearablesLeftSvgs, 'wearables-left', testing, itemSigner)
  await uploadSvgs(wearablesRightSvgs, 'wearables-right', testing, itemSigner)
  await uploadSvgs(wearablesBackSvgs, 'wearables-back', testing, itemSigner)
  await uploadSvgs(wearablesLeftSleeveSvgs, 'sleeves-left', testing, itemSigner)
  await uploadSvgs(wearablesRightSleeveSvgs, 'sleeves-right', testing, itemSigner)
  await uploadSvgs(wearablesBackSleeveSvgs, 'sleeves-back', testing, itemSigner)

  await uploadSvgs(collateralsLeftSvgs, 'collaterals-left', testing, itemSigner)
  await uploadSvgs(collateralsRightSvgs, 'collaterals-right', testing, itemSigner)
  await uploadSvgs(collateralsRightSvgs, 'collaterals-back', testing, itemSigner)

  await uploadSvgs(eyeShapesLeftSvgs, 'eyeShapes-left', testing, itemSigner)
  await uploadSvgs(eyeShapesRightSvgs, 'eyeShapes-right', testing, itemSigner)
  await uploadSvgs(eyeShapesRightSvgs, 'eyeShapes-back', testing, itemSigner)


  const Facet = await ethers.getContractFactory('SvgViewsFacet')
  facet = await Facet.deploy()
  await facet.deployed()
  console.log('Deployed facet:', facet.address)

  // let existingFuncs = getSelectors(facet)
  // for (const selector of newFuncs) {
  //   if (!existingFuncs.includes(selector)) {
  //     throw Error(`Selector ${selector} not found`)
  //   }
  // }
  // existingFuncs = existingFuncs.filter(selector => !newFuncs.includes(selector))

  // const sideViewsSelectors = getSelectors(facet)


  const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 }

  const cut = [
    {
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet)
    }
  ]
  console.log(cut)

  const diamondCut = await ethers.getContractAt('IDiamondCut', diamondAddress, signer)

  if (testing) {
    console.log('Diamond cut')
    tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, '0x', { gasLimit: 8000000 })
    console.log('Diamond cut tx:', tx.hash)
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
    console.log('Completed diamond cut: ', tx.hash)
  } else {
    console.log('Diamond cut')
    tx = await diamondCut.populateTransaction.diamondCut(cut, ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
    await sendToMultisig(process.env.DIAMOND_UPGRADER, signer, tx)
  }

  const svgViewsFacet = await ethers.getContractAt('SvgViewsFacet', diamondAddress, itemSigner)

  console.log("Side view Dimensions: ", sideViewDimensions1[1]);

  // console.log('dimensions:',sideViewDimensions)

  tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions1, { gasLimit: gasLimit })
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`)
  }
  console.log('Uploaded item side dimensions 1')

  tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions2, { gasLimit: gasLimit })
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`)
  }
  console.log('Uploaded item side dimensions 2')

  // tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions3, { gasLimit: gasLimit })
  // receipt = await tx.wait()
  // if (!receipt.status) {
  //   throw Error(`Error:: ${tx.hash}`)
  // }
  // console.log('Uploaded item side dimensions 3')
  //
  // tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions4, { gasLimit: gasLimit })
  // receipt = await tx.wait()
  // if (!receipt.status) {
  //   throw Error(`Error:: ${tx.hash}`)
  // }
  // console.log('Uploaded item side dimensions 4')
  //
  // tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions5, { gasLimit: gasLimit })
  // receipt = await tx.wait()
  // if (!receipt.status) {
  //   throw Error(`Error:: ${tx.hash}`)
  // }
  // console.log('Uploaded item side dimensions 5')
  //
  // tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions6, { gasLimit: gasLimit })
  // receipt = await tx.wait()
  // if (!receipt.status) {
  //   throw Error(`Error:: ${tx.hash}`)
  // }
  // console.log('Uploaded item side dimensions 6')
  //
  // tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions7, { gasLimit: gasLimit })
  // receipt = await tx.wait()
  // if (!receipt.status) {
  //   throw Error(`Error:: ${tx.hash}`)
  // }
  // console.log('Uploaded item side dimensions 7')
  //
  // tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions8, { gasLimit: gasLimit })
  // receipt = await tx.wait()
  // if (!receipt.status) {
  //   throw Error(`Error:: ${tx.hash}`)
  // }
  // console.log('Uploaded item side dimensions 8')
}



if(require.main === module){
    main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
  }

  exports.sideViewsUpgrade = main;
