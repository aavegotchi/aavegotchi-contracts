/* global ethers hre */
/* eslint-disable  prefer-const */

const { LedgerSigner } = require('@ethersproject/hardware-wallets')
// const { itemTypes } = require('./raffle4ItemTypes.js')
const { wearablesSvgs, sleevesSvgs } = require('../svgs/raffe4Wearables.js')

let signer
const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
const gasLimit = 15000000

function setupSvg (...svgData) {
  const svgTypesAndSizes = []
  const svgItems = []
  for (const [svgType, svgs] of svgData) {
    svgItems.push(svgs.join(''))
    svgTypesAndSizes.push([ethers.utils.formatBytes32String(svgType), svgs.map(value => value.length)])
  }
  return [svgItems.join(''), svgTypesAndSizes]
}

async function uploadSvgs (svgType, svgs) {
  let svgFacet = (await ethers.getContractAt('SvgFacet', diamondAddress)).connect(signer)

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
    let tx = await svgFacet.storeSvg(svg, svgTypesAndSizes, { gasLimit: gasLimit })
    let receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`)
    }
    console.log(svgItemsEnd, svg.length)
    if (svgItemsEnd === svgs.length) {
      break
    }
    svgItemsStart = svgItemsEnd
  }
}

async function main () {
  let owner = await (await ethers.getContractAt('OwnershipFacet', diamondAddress)).owner()
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

  await uploadSvgs('sleeves', sleevesSvgs.map(value => value.svg))
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
