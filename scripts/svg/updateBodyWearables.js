/* global ethers */

const fs = require('fs')

const { LedgerSigner } = require('@ethersproject/hardware-wallets')

const bodyWearables = []
const sleeves = []

const wearablesSvgs = [
  bodyWearable('8_MarineJacket'), // bodyWearable("8_MarineJacket"),
  bodyWearable('11_MessDress'), // bodyWearable("11_MessDress"),
  bodyWearable('15_RedPlaid'), // bodyWearable("15_RedPlaid"),
  bodyWearable('16_BluePlaid'), //  bodyWearable("16_BluePlaid"),
  bodyWearable('19_AaveHeroShirt'), // bodyWearable("19_AaveHeroShirt"),
  bodyWearable('22_CaptainAaveSuit'), // bodyWearable("22_CaptainAaveSuit"),
  bodyWearable('28_MarcOutfit'), // bodyWearable("28_MarcOutfit"),
  bodyWearable('31_JordanSuit'), // bodyWearable("31_JordanSuit"),
  bodyWearable('37_ETHTShirt'),
  bodyWearable('43_NogaraEagleArmor'),
  bodyWearable('46_HalfRektShirt'),
  bodyWearable('50_GldnXrossRobe'),
  bodyWearable('54_LlamacornShirt'),
  bodyWearable('56_AagentShirt'),
  bodyWearable('74_JaayHaoSuit'),
  bodyWearable('85_GentlemanSuit'),
  bodyWearable('91_PajamaPants'),
  bodyWearable('102_WitchCape'),
  bodyWearable('105_PortalMageArmor'),
  bodyWearable('109_RastaShirt'),
  bodyWearable('112_HazmatSuit'),
  bodyWearable('114_RedHawaiianShirt'),
  bodyWearable('115_BlueHawaiianShirt')
]

function stripSvg (svg) {
  // removes svg tag
  if (svg.includes('viewBox')) {
    svg = svg.slice(svg.indexOf('>') + 1)
    svg = svg.replace('</svg>', '')
  }
  return svg
}

function readSvg (name) {
  return stripSvg(fs.readFileSync(`./svgs/svgItems/${name}.svg`, 'utf8'))
}
function setupSvg (...svgData) {
  const svgTypesAndSizes = []
  const svgs = []
  for (const [svgType, svg] of svgData) {
    svgs.push(svg.join(''))
    svgTypesAndSizes.push([ethers.utils.formatBytes32String(svgType), svg.map(value => value.length)])
  }
  return [svgs.join(''), svgTypesAndSizes]
}

function setupSvgUpdate (...svgData) {
  const svgTypesAndIdsAndSizes = []
  const svgs = []
  for (const [itemType, svgItems] of svgData) {
    const svg = svgItems.map(value => value.svg)
    const ids = svgItems.map(value => value.id)
    svgs.push(svg.join(''))
    svgTypesAndIdsAndSizes.push([ethers.utils.formatBytes32String(itemType), ids, svg.map(value => value.length)])
  }
  return [svgs.join(''), svgTypesAndIdsAndSizes]
}

function bodyWearable (name) {
  let svg = readSvg(name)
  bodyWearables.push({ id: name.slice(0, name.indexOf('_')), svg: svg })
  const leftSleevesUp = '<g class="gotchi-sleeves gotchi-sleeves-left gotchi-sleeves-up">' + readSvg(`${name}LeftUp`) + '</g>'
  const leftSleeves = '<g class="gotchi-sleeves gotchi-sleeves-left gotchi-sleeves-down">' + readSvg(`${name}Left`) + '</g>'
  const rightSleevesUp = '<g class="gotchi-sleeves gotchi-sleeves-right gotchi-sleeves-up">' + readSvg(`${name}RightUp`) + '</g>'
  const rightSleeves = '<g class="gotchi-sleeves gotchi-sleeves-right gotchi-sleeves-down">' + readSvg(`${name}Right`) + '</g>'
  svg = '<g>' + leftSleevesUp + leftSleeves + rightSleevesUp + rightSleeves + '</g>'
  sleeves.push({ id: name.slice(0, name.indexOf('_')), svg: svg })
}

async function main () {
  // const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  // kovan
  const diamondAddress = '0xd0576c4371bBb9e531700898760B0064237832Ee'
  // const signer = new LedgerSigner(ethers.provider)
  // const svgFacet = (await ethers.getContractAt('SvgFacet', diamondAddress)).connect(signer)
  // kovan
  const svgFacet = await ethers.getContractAt('SvgFacet', diamondAddress)
  let tx
  let receipt
  console.log('Uploading Body Wearable Svgs')
  let svg, svgTypesAndIdsAndSizes
  console.log('Number of wearables:' + bodyWearables.length)
  let svgItemsStart = 0
  let svgItemsEnd = 0
  while (true) {
    let itemsSize = 0
    while (true) {
      if (svgItemsEnd === bodyWearables.length) {
        break
      }
      itemsSize += bodyWearables[svgItemsEnd].svg.length
      if (itemsSize > 24576) {
        break
      }
      svgItemsEnd++
    }
    ;[svg, svgTypesAndIdsAndSizes] = setupSvgUpdate(
      ['wearables', bodyWearables.slice(svgItemsStart, svgItemsEnd)]
    )
    console.log(`Uploading ${svgItemsStart} to ${svgItemsEnd} wearable SVGs`)
    tx = await svgFacet.updateSvg(svg, svgTypesAndIdsAndSizes)
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Error updating body wearable SVG: ${tx.hash}`)
    }
    console.log(svgTypesAndIdsAndSizes)
    // console.log('Uploaded body wearable SVG:', tx.hash)
    if (svgItemsEnd === wearablesSvgs.length) {
      break
    }
    svgItemsStart = svgItemsEnd
  }

  console.log('Uploading Sleeves Svgs')
  let svgTypesAndSizes
  console.log('Number of sleeves:' + sleeves.length)
  svgItemsStart = 0
  svgItemsEnd = 0
  while (true) {
    let itemsSize = 0
    while (true) {
      if (svgItemsEnd === sleeves.length) {
        break
      }
      itemsSize += sleeves[svgItemsEnd].svg.length
      if (itemsSize > 24576) {
        break
      }
      svgItemsEnd++
    }
    ;[svg, svgTypesAndSizes] = setupSvg(
      ['sleeves', sleeves.map(value => value.svg).slice(svgItemsStart, svgItemsEnd)]
    )
    console.log(`Uploading ${svgItemsStart} to ${svgItemsEnd} sleeves SVGs`)
    tx = await svgFacet.storeSvg(svg, svgTypesAndSizes)
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Error updating sleeves SVG: ${tx.hash}`)
    }
    console.log(svgTypesAndSizes)
    console.log('Uploaded sleeves SVG:', tx.hash)
    if (svgItemsEnd === wearablesSvgs.length) {
      break
    }
    svgItemsStart = svgItemsEnd
  }

  const sleevesStruct = []
  sleeves.forEach((value, index) => {
    sleevesStruct.push({
      sleeveId: index,
      wearableId: value.id
    })
  })
  console.log()
  tx = await svgFacet.setSleeves(sleevesStruct)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error setting sleeves: ${tx.hash}`)
  }
  console.log('Set sleeves:', tx.hash)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
