/* global ethers hre */
/* eslint-disable  prefer-const */

const { LedgerSigner } = require('@ethersproject/hardware-wallets')
const { uniclyBaadgeItemTypes:itemTypes } = require('../itemTypes/uniclyBaadgeItemType')
const { badgeSvgs } = require('../../svgs/uniclyBaadgeSvg')

let signer
const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
const gasLimit = 15000000

function strDisplay (str) {
  return addCommas(str.toString())
}

function addCommas (nStr) {
  nStr += ''
  const x = nStr.split('.')
  let x1 = x[0]
  const x2 = x.length > 1 ? '.' + x[1] : ''
  var rgx = /(\d+)(\d{3})/
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2')
  }
  return x1 + x2
}

async function uploadSvgs (svgs, svgType, testing, signer) {
  let svgFacet = (await ethers.getContractAt('SvgFacet', diamondAddress)).connect(signer)
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
    console.log(`Uploading ${svgItemsStart} to ${svgItemsEnd} badges SVGs`)
    printSizeInfo(svgTypesAndSizes)
    if (testing) {
      let tx = await svgFacet.storeSvg(svg, svgTypesAndSizes, { gasLimit: gasLimit })
      let receipt = await tx.wait()
      if (!receipt.status) {
        throw Error(`Error:: ${tx.hash}`)
      }
      console.log('Gas used:' + strDisplay(receipt.gasUsed))
      console.log(svgItemsEnd, svg.length)
    } else {
      let tx = await svgFacet.storeSvg(svg, svgTypesAndSizes)
    }
    if (svgItemsEnd === svgs.length) {
      break
    }
    svgItemsStart = svgItemsEnd
  }
}

async function main () {
  let owner = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119" 
  const testing = ['hardhat', 'localhost'].includes(hre.network.name)
  if (testing) {
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [owner]
    })
    signer = await ethers.provider.getSigner(owner)
  } else if (hre.network.name === 'matic') {
    signer = new LedgerSigner(ethers.provider,"hid","m/44'/60'/2'/0/0")
  } else {
    throw Error('Incorrect network selected')
  }
  let tx
  let receipt
  let itemsFacet = (await ethers.getContractAt('contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet', diamondAddress)).connect(signer)

  let daoFacet = (await ethers.getContractAt('DAOFacet', diamondAddress)).connect(signer)

  console.log('Adding items', 0, 'to', itemTypes.length)
  if (testing) {

    tx = await daoFacet.addItemTypes(itemTypes, { gasLimit: gasLimit })
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`)
    }
    console.log('Items were added:', tx.hash)
    console.log('Gas used:' + strDisplay(receipt.gasUsed))
  } else {
    tx = await daoFacet.addItemTypes(itemTypes)
    console.log('Items added:', tx.hash)
    
  }
  

  await uploadSvgs(badgeSvgs, 'wearables', testing, signer)
 
  console.log('Send items to Aavegotchi Item Manager')
  let mintAddress = '0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119'

  let itemIds = [175]
  let quantities = [0]

  console.log('Minting items')
  if (testing) {
    tx = await daoFacet.mintItems(mintAddress, itemIds, quantities)
    receipt = await tx.wait()
    console.log('Gas used:' + strDisplay(receipt.gasUsed))
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`)
    }
    console.log('Prize items minted:', tx.hash)
    // Aavegotchi equips

    // Check that items are received

    if (testing) {
      const balance = await itemsFacet.balanceOf(mintAddress, '169')
      console.log('balance of 169:', balance.toString())

      // Check the SVG output
      const svgFacet = await ethers.getContractAt('SvgFacet', diamondAddress)
      let wearables = ethers.utils.formatBytes32String('wearables')
      const itemSvg = await svgFacet.getSvg(wearables, 169)

     // console.log('item svg:',itemSvg)
    }

    //  console.log('item svg:',itemSvg)
  } else {
    // Rarity 10, Kinship 10, XP 10, Rarity 100, Kinship 100, XP 100
    tx = await daoFacet.mintItems(mintAddress, itemIds, quantities, { gasLimit: gasLimit })
   // await sendToMultisig(process.env.DIAMOND_UPGRADER, signer, tx)
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  main()
    .then(() => console.log('adding badges finished') /* process.exit(0 */)
    .catch(error => {
      console.error(error)
      // process.exit(1)
    })
}

exports.addUniclyBaadge = main
