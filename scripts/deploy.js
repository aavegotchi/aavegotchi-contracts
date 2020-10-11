/* global ethers bre */

// We require the Buidler Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.
// eslint-disable-next-line no-unused-vars
const bre = require('@nomiclabs/buidler')

// const util = require('./diamond-util.js')

const diamond = require('diamond-util')
const { getCollaterals } = require('./collaterals.js')

async function main () {
  // Buidler always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await bre.run('compile');

  const accounts = await ethers.getSigners()
  const account = await accounts[0].getAddress()
  console.log('Account: ' + account)
  console.log('---')

  // ethereum mainnet
  // const ghstContractAddress = 'x3F382DbD960E3a9bbCeaE22651E88158d2791550'

  // kovan:
  const ghstContractAddress = '0x3F382DbD960E3a9bbCeaE22651E88158d2791550'

  const DiamondLoupeFacetFactory = await ethers.getContractFactory('DiamondLoupeFacet')
  const diamondLoupeFacet = await DiamondLoupeFacetFactory.deploy()
  await diamondLoupeFacet.deployed()

  // eslint-disable-next-line no-unused-vars
  const aavegotchiDiamond = await diamond.deploy({
    diamondName: 'AavegotchiDiamond',
    facets: [
      'DiamondCutFacet',
      ['DiamondLoupeFacet', diamondLoupeFacet],
      'OwnershipFacet',
      'AavegotchiFacet',
      'SVGStorageFacet',
      'WearablesFacet'
    ],
    owner: account,
    otherArgs: [ghstContractAddress, getCollaterals(bre.network.name)]
  })
  console.log('Diamond address:' + aavegotchiDiamond.address)

  // ----------------------------------------------------------------
  // Upload SVG layers
  let sizes
  let svgs
  const svgStorageFacet = await ethers.getContractAt('SVGStorageFacet', aavegotchiDiamond.address)

  svgs = [
    // background eth
    '<defs fill="#fff"><pattern id="a" patternUnits="userSpaceOnUse" width="4" height="4"><path d="M0 0h1v1H0zm2 2h1v1H2z"/></pattern><pattern id="b" patternUnits="userSpaceOnUse" x="0" y="0" width="2" height="2"><path d="M0 0h1v1H0z"/></pattern><pattern id="c" patternUnits="userSpaceOnUse" x="-2" y="0" width="8" height="1"><path d="M0 0h1v1H0zm2 0h1v1H2zm2 0h1v1H4z"/></pattern><pattern id="d" patternUnits="userSpaceOnUse" x="0" y="0" width="4" height="4"><path d="M0 0h1v1H0zm0 2h1v1H0zm1 0V1h1v1zm1 0h1v1H2zm0-1h1V0H2zm1 2h1v1H3z"/></pattern><pattern id="e" patternUnits="userSpaceOnUse" width="64" height="32"><path d="M4 4h1v1H4zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1z"/><path fill="url(#a)" d="M0 8h64v7H0z"/><path fill="url(#b)" d="M0 16h64v1H0z"/><path fill="url(#c)" d="M0 18h64v1H0z"/><path fill="url(#b)" d="M22 18h15v1H22zM0 20h64v3H0z"/><path fill="url(#d)" d="M0 24h64v8H0z"/></pattern><mask id="f"><path fill="url(#e)" d="M0 0h64v32H0z"/></mask></defs><path fill="#c260ff" d="M0 0h64v32H0z"/><path fill="#dea8ff" mask="url(#f)" d="M0 0h64v32H0z"/><path fill="#dea8ff" d="M0 32h64v32H0z"/><path mask="url(#f)" fill="#c260ff" transform="matrix(1 0 0 -1 0 64)" d="M0 0h64v32H0z"/>',
    // body eth
    '<g class="primaryColor"><path d="M21 12h2v-2h-4v2h1z"/><path d="M19 14v-2h-2v2h1zm6-4h2V8h-4v2h1z"/><path d="M29 8h8V6H27v2h1zm16 6h2v-2h-2v1z"/><path d="M48 14h-1v39h-2v2h4V14zm-11-4h4V8h-4v1z"/><path d="M41 12h4v-2h-4v1zM17 53V14h-2v41h4v-2h-1z"/><path d="M24 51h-5v2h5v-1z"/><path d="M27 53h-3v2h5v-2h-1zm18-2h-5v2h5v-1z"/><path d="M35 51h-6v2h6v-1z"/><path d="M38 53h-3v2h5v-2h-1z"/></g><g class="secondaryColor"><path d="M18 43v6h2v-1h2v1h2v2h-5v2h-2V14h2v1h-1v26z"/><path d="M27 51h-3v2h5v-2h-1zm11 0h-3v2h5v-2h-1z"/><path d="M35 49h-2v-1h-2v1h-2v2h6v-1zM25 11h2v-1h-4v1h1zm-4 2h2v-1h-4v1h1zm24 31v5h-1v-1h-2v1h-2v2h5v2h2V14h-2v29z"/><path d="M37 8H27v1h5v1h5V9zm8 4h-4v2h4v-1z"/><path d="M41 10h-4v2h4v-1z"/></g><path d="M44 14h-3v-2h-4v-2h-5V9h-5v2h-4v2h-4v2h-1v34h2v-1h2v1h2v2h5v-2h2v-1h2v1h2v2h5v-2h2v-1h2v1h1V14z" fill="#fff"/>',
    // eyes
    '<g class="primaryColor"><path d="M23 28v2h4v-2h2v-4h-2v-2h-4v2h-2v4h1zm12-4v4h2v2h4v-2h2v-4h-2v-2h-4v2h-1z"/></g>',
    // mouth
    '<g class="primaryColor"><path d="M29 32h-2v2h2v-1z"/><path d="M33 34h-4v2h6v-2h-1z"/><path d="M36 32h-1v2h2v-2z"/></g>',
    // hands
    '<g class="primaryColor"><path d="M19 42h1v1h-1zm1-6h1v1h-1z"/><path d="M21 37h1v1h-1zm5 3v4h1v-4zm-5 3h-1v1h2v-1z"/><path d="M24 44h-2v1h4v-1h-1zm1-5h-1v1h2v-1z"/><path d="M23 38h-1v1h2v-1z"/></g><g class="secondaryColor"><path d="M19 43h1v1h-1zm5 2h-2v1h4v-1h-1z"/><path d="M27 41v3h1v-3zm-6 3h-1v1h2v-1z"/><path d="M26 44h1v1h-1zm-7-3h-1v2h1v-1z"/></g><g class="primaryColor"><path d="M44 42h1v1h-1zm-1-6h1v1h-1z"/><path d="M42 37h1v1h-1z"/><path d="M42 39v-1h-2v1h1zm0 4v1h2v-1h-1z"/><path d="M40 44h-2v1h4v-1h-1z"/><path d="M38 42v-2h-1v4h1v-1z"/><path d="M40 40v-1h-2v1h1z"/></g><g class="secondaryColor"><path d="M42 44v1h2v-1h-1zm-5-2v-1h-1v3h1v-1z"/><path d="M40 45h-2v1h4v-1h-1z"/><path d="M37 44h1v1h-1zm7-1h1v1h-1z"/></g>'
  ]
  sizes = svgs.map(value => value.length)
  svgs = svgs.join('')
  console.log('Uploading Aavegotchi SVG Layers...')
  await svgStorageFacet.storeAavegotchiLayersSVG(svgs, sizes)
  console.log('Uploaded Aavegotchi SVG Layers')

  svgs = [
    // farmer hat
    '<g fill="#a97955"><path d="M31 14h-2v2h2v-1zm-10 2h2v-2h-2v1zm6-2h-2v2h2v-1zm14 0v2h2v-2h-1zm-2 0h-2v2h2v-1zm-4 0h-2v2h2v-1zm-12-2v-2h-2v2h1zm4 0v-2h-2v2h1zm10-2v2h2v-2h-1zm-6 2v-2h-2v2h1zm2 0h2v-2h-2v1z"/><path d="M31 10h2V8h-2v1zm-2 0V8h-2v2h1zm-4 0V8h-2v2h1zm14-2v2h2V8h-1z"/><path d="M35 10h2V8h-2v1zm-8-2V6h-2v2h1z"/><path d="M29 8h2V6h-2v1zm8 0h2V6h-2v1zm-4 0h2V6h-2v1zm8 2v2h2v-2h-1zm-20 6h-2v2h2v-1zm8 0h-2v2h2v-1zm-4 0h-2v2h2v-1zm20 0h-2v2h2v-1z"/><path d="M37 16h-2v2h2v-1zm4 0h-2v2h2v-1zm-12-4h-2v2h2v-1zm-4 2v-2h-2v2h1zm8-2h-2v2h2v-1zm4 0h-2v2h2v-1zm2 0v2h2v-2h-1zm-6 4h-2v2h2v-1z"/><path d="M56 20h-5v-2h-2v2h-2v-2h-2v2h-2v-2h-2v2h-2v-2h-2v2h-2v-2h-2v2h-2v-2h-2v2h-2v-2h-2v2h-2v-2h-2v2h-2v-2h-2v2h-2v-2h-2v2H7v2h50v-2z"/><path d="M45 8h-2v2h2v2h-2v2h2v2h2v2h2v-4h-2V6h-2v1z"/><path d="M21 6v2h2V6h2V4h2v2h2V4h2v2h2V4h2v2h2V4h2v2h2v2h2V6h2V4h-4V2H23v2h-4v2h1z"/><path d="M17 18v-2h2v-2h2v-2h-2v-2h2V8h-2V6h-2v8h-2v4h1z"/></g><g fill="#de9a53"><path d="M31 18v2h2v-2h-1zm-12 0v2h2v-2h-1zm8 0v2h2v-2h-1zm-4 0v2h2v-2h-1zm20 0v2h2v-2h-1zm-8 0v2h2v-2h-1zm4 0v2h2v-2h-1zm-24 0v2h2v-2h-1zm33 0h-1v2h2v-2zm-15-4h-2v2h2v-1zm-12 2v-2h-2v2h1zm8-2h-2v2h2v-1zm-4 0h-2v2h2v-1zm18 2h2v-2h-2v1zm-6-2h-2v2h2v-1zm4 0h-2v2h2v-1zm-10-2h2v-2h-2v1zm-10-2h-2v2h2v-1zm8 2v-2h-2v2h1zm-4 0v-2h-2v2h1z"/><path d="M35 12h2v-2h-2v1zm-12-2V8h-2v2h1zm4 0V8h-2v2h1zm2 0h2V8h-2v1z"/><path d="M37 10h2V8h-2v1zm-4 0h2V8h-2v1z"/><path d="M45 8V6h-2v2h1zM31 8h2V6h-2v1zm-6 0V6h-2v2h1zm2 0h2V6h-2v1zm8 0h2V6h-2v1zm4 0h2V6h-2v1z"/><path d="M39 6V4h-2v2h1zm-4 0V4h-2v2h1zm-4 0V4h-2v2h1zm-4 0V4h-2v2h1zm12 6h2v-2h-2v1z"/><path d="M41 10h2V8h-2v1zM21 8V6h-2v2h1z"/><path d="M43 12h2v-2h-2v1zm-12 4h-2v2h2v-1zm-8 0h-2v2h2v-1zm-4 0h-2v2h2v-1zm8 0h-2v2h2v-1zm16 0h-2v2h2v-1zm-4 0h-2v2h2v-1zm8 0h-2v2h2v-1z"/><path d="M31 12h-2v2h2v-1zm-8 2v-2h-2v2h1zm4-2h-2v2h2v-1zm8 0h-2v2h2v-1zm4 0h-2v2h2v-1zm2 0v2h2v-2h-1zm-6 4h-2v2h2v-1z"/></g>',
    // farmer pants
    '<g fill="#003ca0"><path d="M48 41H15v14h4v-2h-3v-5h2v-1h-2v-3h2v3h1v-3h12v7h-2v2h6v-2h-3v-2h1v-1h-1v-4h13v3h1v-3h2v3h-2v1h2v5h-3v2h4V41h-1zm-25 2h-7v-1h8v1h-1zm7 0h-5v-1h6v1h-1zm2 0v-1h1v1h-1zm6 0h-4v-1h5v1h-1zm10 0h-8v-1h8v1z"/><path d="M27 53h-3v2h5v-2h-1z"/><path d="M24 51h-5v2h5v-1zm9-6h0v2h1v-3h-1z"/><path d="M33 47h1v1h-1zm5 6h-3v2h5v-2h-1z"/><path d="M45 51h-5v2h5v-1z"/></g><g fill="#4bafff"><path d="M29 44H19v3h-1v1h-2v5h3v-2h5v2h5v-2h2v-7h-1z"/><path d="M18 45v-1h-2v3h2v-1zm15 1v-2h-1v4h1v-1zm14-2h-1v3h2v-3z"/><path d="M45 46v-2H34v4h-1v1h-1v2h3v2h5v-2h5v2h3v-5h-2v-1h-1z"/></g><path d="M32 42h1v1h-1z" fill="#a97955"/><path d="M29 42h-4v1h6v-1h-1zm8 0h-3v1h5v-1h-1zm-15 0h-6v1h8v-1h-1zm25 0h-7v1h8v-1z" fill="#de9a53"/>',
    // farmer stick
    '<path d="M12 58H8v1h1v1h3v-1h1v-1z" opacity=".25"/><g fill="#935628"><path d="M11 30v-6h-1v6H8v1h2v24h1V31h2v-1h-1z"/><path d="M8 28v-4H7v6h1v-1zm5-4v6h1v-6z"/></g>'
  ]
  sizes = svgs.map(value => value.length)
  svgs = svgs.join('')
  console.log('Uploading Wearables SVG...')
  await svgStorageFacet.storeWearablesSVG(svgs, sizes)
  console.log('Uploaded Wearables SVG')

  svgs = [
    // sealed closed portal
    '<path d="M34 7h-2v3h1V9h1V8h1V7z" fill="#aa2de8"/><path d="M34 6V5h-1V4h-1v3h3V6z" fill="#cb78ff"/><path d="M31 7h-2v1h1v1h1v1h1V7z" fill="#c260ff"/><path d="M31 4v1h-1v1h-1v1h3V4z" fill="#dfacff"/><g fill="#141414"><path d="M41 14h-4v2h4v-1zm-8-2h-4v2h6v-2h-1z"/><path d="M37 11v-1h-2v2h2zm12 18v4h2v-4h-1zm2 8v-2h-2v4h2v-1zm0 16h-2v2h2v-1z"/><path d="M51 59h-2v2h2v-1zm0-33v-1h-2v2h2zm-2-4h2v-2h-2v1zm2 33v2h2v-2h-1z"/><path d="M51 45h-2v2h4v-2h-1zm0 16v3h2v-3h-1zm-2-42v-1h-4v2h4z"/><path d="M45 16h-4v2h4v-1zm9 23h-3v2h4v-2zM25 14h-2v2h4v-2h-1zm4-4h-2v2h2v-1zm-12 8h-2v2h4v-2h-1zm-4 11v4h2v-4h-1zm0 6v4h2v-4h-1zm0 18v2h2v-2h-1z"/><path d="M13 45h-2v2h4v-2h-1zm0 14v2h2v-2h-1zm0-34v2h2v-2h-1zm-2 30v2h2v-2h-1z"/><path d="M11 61v3h2v-3h-1zm0-22H9v2h4v-2h-1zm2-19v2h2v-2h-1zm8-4h-2v2h4v-2h-1z"/></g><g fill="#1e1e1e"><path d="M45 12h2v-2h-2V8h-6v4h-2v2h8v-1z"/><path d="M39 6h-2V4h-2V2h-6v2h-2v2h-2v2h2v2h2v2h6v-2h2V8h2V6zm-4 2v1h-1v1h-1v1h-2v-1h-1V9h-1V8h-1V6h1V5h1V4h1V3h2v1h1v1h1v1h1v2h-1zm15 10h1v-2h2v-2h-2v-2h-4v2h-2v4h4z"/><path d="M51 20v2h-2v3h6v-7h-4v1zm4 15h-4v4h6v-4h-1zm0 8h-4v-2h-2v4h4v2h2v-2h2v-2h-1zm0 10v-2h-2v-2h-4v4h2v2h2v2h2v-2h2v-2h-1zm0 6h-4v2h2v3h4v-5h-1zm1-32h-5v6h4v-2h2v-4zM23 8h-4v2h-2v2h2v2h8v-2h-2V8h-1zM13 49h-2v2H9v2H7v2h2v2h2v-2h2v-2h2v-4h-1zm0-8v2H7v2h2v2h2v-2h4v-4h-1zm-2 18H7v5h4v-3h2v-2h-1zm0-41H9v7h6v-3h-2v-4h-1z"/><path d="M17 14v-2h-4v2h-2v2h2v2h6v-4h-1zM9 31v2h4v-6H7v4h1zm0 8h4v-4H7v4h1z"/></g><g fill="#323232"><path d="M45 8v2h2V8h-1zm-8-4v2h2V4h-1z"/><path d="M37 2h-2v2h2V3z"/><path d="M35 0h-6v2h6V1z"/><path d="M27 2v2h2V2h-1zm14 4v2h2V6h-1zm12 7v-1h-2v2h2z"/><path d="M51 10h-2v2h2v-1zm4 39h-2v2h2v-1z"/><path d="M57 51h-2v2h2v-1zm0-28v-5h-2v5h1zm0 10h-2v2h2v4h2v-6h-1zm0 24h-2v2h2v2h2v-4h-1z"/><path d="M57 53v2h2v-2h-1zm0-6v2h2v-2h-1zm0-6h-2v2h2v2h2v-4h-1zm1-16h-3v2h2v2h2v-4zM17 8v2h2V8h-1zm8-4v2h2V4h-1zm-4 2v2h2V6h-1zm-10 6v2h2v-2h-1z"/><path d="M13 10v2h2v-2h-1zM9 49v2h2v-2h-1z"/><path d="M7 51v2h2v-2H8zm0 6H5v4h2v-2h2v-2H8zm2-34v-5H7v5h1zm-2 6v-2h2v-2H5v4h1z"/><path d="M7 49v-2H5v2h1zm-2 4v2h2v-2H6zm2-8v-2h2v-2H5v4h1zm0-6v-4h2v-2H5v6h1z"/></g><g fill="#282828"><path d="M27 55v2h2v-2h-1zm0-10v2h2v-2h-1zm0 16v3h2v-3h-1zm0-22h-2v2h4v-2h-1zm-4 17v4h2v-4h-1zm0-20h2v-2h-2v1zm0 6h-2v2h4v-2h-1zm0-12h2v-2h-2v1z"/><path d="M23 50v4h2v-4h-1zm0 12v2h2v-2h-1zm0-28v-2h-2v2h1zm0-6v-3h2v-2h-4v5h1z"/><path d="M23 48h-4v2h4v-1zm8 8v4h2v-4h-1zm0-22v2h2v-2h-1zm0 8v2h2v-2h-1zm0-14v2h2v-2h-1zm0 22v4h2v-4h-1zm0 12v2h2v-2h-1zm-2-44h-2v2h2v-1z"/><path d="M31 21v-1h-2v2h2zm-4 2v2h2v-2h-1zm-4-3v-2h-2v2h1zm12 35v2h2v-2h-1zm0-10v2h2v-2h-1zm0 16v3h2v-3h-1zm4-21v-1h-4v2h4zm0 16v4h2v-4h-1zm2-20v-2h-2v2h1zm0-6v-2h-2v2h1zm-2 20v4h2v-4h-1zm0 12v2h2v-2h-1z"/><path d="M43 34v-2h-2v2h1zm-2 8h-2v2h4v-2h-1zm2-14v-5h-4v2h2v3h1zm1 20h-3v2h4v-2zm-7-28v-2h-2v2h1z"/><path d="M35 21v-1h-2v2h2zm-2-5v-2h-2v2h1zm2 7v2h2v-2h-1zm8-3v-2h-2v2h1z"/></g><path d="M35 12v2h2v-2h-1z"/><path d="M39 12V8h-2v4h1zm-6-3h1v1h-1z"/><path d="M34 8h1v1h-1z"/><path d="M35 8h1V6h-1v1zm6 0V6h-2v2h1z"/><path d="M34 5h1v1h-1z"/><path d="M33 4h1v1h-1zm16 57v3h2v-3h-1zm2-22h-2v-3h-2v2h-2v2h-6v1h-4v2h4v-1h6v2h4v-2h-2v-2h2v1h2v-1zm-2-12v-2h-2v3h2v1h2v-2h-1zm-2-7v2h2v-2h-1z"/><path d="M49 19v1h2v-2h-2z"/><path d="M53 18h2v-4h-2v2h-2v2h1zm-10-2h2v-2h-4v2h1z"/><path d="M47 14v-2h-2v2h1z"/><path d="M49 12v-2h-2v2h1zm4 21h-4v-1h-4v2h4v1h6v-2h-1zm0 24h-2v-2h-2v1h-4v2h2v2h2v-1h6v-2h-1zm0-16h-2v2h4v-2h-1zm0-16h-2v2h4v-2h-1z"/><path d="M55 24v1h2v-2h-2zm3 5h-1v2h-2v2h4v-4zm-1 26h-2v2h4v-2h-1zm0-10h-2v2h-6v1h-4v2h4v-1h6v2h2v2h2v-4h-2v-2h2v-2h-1zm0 16v3h2v-3h-1zm0-22h-2v2h4v-2h-1zM29 12h-2v2h2v-1zm2-2v1h2v-1h-1z"/><path d="M27 10V8h-2v4h2v-1zm3-1h1v1h-1z"/><path d="M29 8h1v1h-1z"/><path d="M29 7V6h-1v2h1zm-4-1h-2v2h2V7z"/><path d="M29 5h1v1h-1z"/><path d="M30 4h1v1h-1z"/><path d="M33 4V3h-2v1h1zM15 22h2v-2h-2v1zm-2 7h2v-1h2v-3h-2v2h-2v1zm0 32v3h2v-3h-1z"/><path d="M11 41H9v2h4v-2h-1zm2-21h2v-2h-2v1zm6-4h4v-2h-4v1z"/><path d="M17 14h2v-2h-2v1z"/><path d="M17 12v-2h-2v2h1zM9 27h4v-2H9v1zm2-9h2v-2h-2v-2H9v4h1zM9 31H7v-2H5v4h4v-1z"/><path d="M9 55H5v2h4v-1zm0-16H5v2h4v-1zm0-14v-2H7v2h1zM5 61v3h2v-3H6zm22-28h-2v-1h-2v2h2v1h4v-2h-1zm0 24h-2v2h4v-2h-1zm0-16h-2v-1h-6v-2h-2v-2h-2v3h-2v2h2v-1h2v2h-2v2h4v-2h6v1h4v-2h-1zm-4 19v2h2v-2h-1z"/><path d="M25 28v-1h4v-2h-6v3h1zm-2 2h-4v2h4v-1zm0 16h-4v2h4v-1zm-2 16h-2v2h4v-2h-1zm0-6h4v-2h-6v2h1z"/><path d="M19 57v-1h-4v-1h-2v2H9v2h6v1h2v-2h2zm-2-25h-2v1H9v2h6v-1h4v-2h-1zm0 16h-2v-1H9v-2H5v2h2v2H5v4h2v-2h2v-2h6v1h4v-2h-1zm14 12v2h2v-2h-1zm0-34v2h2v-4h-2v1zm-2-6h2v-2h-2v1z"/><path d="M31 16v-2h-2v2h1zm0 6h-2v2h2v-1z"/><path d="M23 18h6v-2h-6v1zm-2 4h4v-2h-4v1z"/><path d="M21 18h-2v2h2v-1zm-2 5v2h2v-2h-1zm16 8h-2v-1h-2v1h-2v2h2v1h2v-1h2v-1zm0 24h-2v-1h-2v1h-2v2h2v-1h2v1h2v-1z"/><path d="M35 39h-2v1h-2v-1h-2v2h2v1h2v-1h2v-1zm4 19v-1h-4v2h4zm2 2h-2v2h2v-1zm-2-28v1h-4v2h4v-1h2v-2h-1z"/><path d="M40 28h1v-3h-6v2h4v1zm-1 20v-1h-4v-2h-2v3h-2v-3h-2v2h-4v1h-2v2h2v-1h4v2h2v-1h2v1h2v-2h4v1h2v-2h-1zm6 6h-6v2h6v-1zm0-24h-4v2h4v-1z"/><path d="M45 46h-4v2h4v-1zm-2 16h-2v2h4v-2h-1zm-8-44h6v-2h-6v1z"/><path d="M33 18v2h2v-2h-1zm0-4v2h2v-2h-1zm2 10v-2h-2v2h1zm6-4h-2v2h4v-2h-1z"/><path d="M45 19v-1h-2v2h2zm-2 4v2h2v-2h-1z"/><g fill="#464646"><path d="M29 33v2h2v-2h-1zm0 18v2h2v-2h-1zm0 6v2h2v-2h-1zm0-16v2h2v-2h-1zm0-16v2h2v-2h-1zm-4 24v2h2v-2h-1zm-6-11v2h2v-2h-1zm-2 16v-4h-2v6h4v-2h-1z"/><path d="M19 36h-2v2h2v-1zm-2 10v-2h-2v4h4v-2h-1zm0 16v-2h-2v4h4v-2h-1zm0-30h2v-2h-2v-2h-2v4h1z"/><path d="M17 34h-2v2h2v-1zm0 8v-2h-2v2h1zm2-22v2h2v-2h-1z"/><path d="M17 22v1h-2v2h4v-3h-1zm16 11v2h2v-2h-1zm0 18v2h2v-2h-1zm0 6v2h2v-2h-1zm0-16v2h2v-2h-1zm0-16v2h2v-2h-1zm4 24v2h2v-2h-1zm6-11v2h2v-2h-1z"/><path d="M45 36v2h2v-2h-1zm2 24v2h-2v2h4v-4h-1z"/><path d="M47 40v2h2v-2h-1zm0-6v2h2v-2h-1zm0 10v2h-2v2h4v-4h-1zm0-16v2h-2v2h4v-4h-1zm0 22v4h-2v2h4v-6h-1zM33 16h-4v2h2v2h2v-2h2v-2h-1zm12 4h-2v2h2v-1z"/><path d="M48 23h-1v-1h-2v3h4v-2z"/></g><g fill="#373737"><path d="M29 53v-4h-2v2h-2v6h2v-2h4v-2h-1zm0 6h-4v5h2v-3h2v3h2v-5h-1zm-3-26h3v-2h2v-4h-6v3h-2v2h2v1zm-5 23h-2v2h-2v4h6v-6h-1z"/><path d="M23 28h-2v-3h-4v5h6v-1zm-2 22h-4v4h6v-4h-1zm8-34v-2h-2v2h1zm0 9h2v-1h-2zm-10-3v-2h-2v2h1z"/><path d="M20 23h5v2h2v-2h2v-3h-2v-2h-4v2h2v2h-6v1zm-3-1h-2v1h2zm20 29v-2h-2v4h-2v2h4v2h2v-6h-1zm0 8h-4v5h2v-3h2v3h2v-5h-1zm2-29v-3h-6v4h2v2h4v-1h2v-2h-1zm6 28v-2h-4v6h6v-4h-1zm0-24v-2h-2v2h-2v2h-2v-1h-6v1h-2v-1h-6v1h-2v-2h-2v-2h-2v2h-2v2h2v2h2v2h4v-1h6v1h2v-1h6v1h4v-2h2v-2h2v-2h-1zm0 10v-2h-2v2h-4v-1h-6v1h-2v-1h-6v1h-4v-2h-2v2h-2v2h6v2h2v-1h2v-2h4v3h2v-3h4v2h2v1h2v-2h6v-2h-1z"/><path d="M45 50h-4v4h6v-4h-1zm0-25h-2v3h-2v2h6v-5h-1zm-8-9v-2h-2v2h1zm-3 9h1v-1h-2v1z"/><path d="M33 24v-4h-2v4h1zm14-4h-2v2h2v-1z"/><path d="M48 22h-1v1h2v-1zm-5 0h-4v-2h2v-2h-4v2h-2v3h2v2h2v-2h6v-1h-1z"/></g>',
    // open portal
    '<g fill="#9800cd"><path d="M27 36v2h2v-2h-1z"/><path d="M29 34v2h2v-2h-1zm6 0h-2v2h2v-1z"/><path d="M36 36h-1v2h2v-2zm-7 6v2h2v-2h-1z"/><path d="M29 40h-2v2h2v-1zm4 2v2h2v-2h-1z"/><path d="M35 40v2h2v-2h-1z"/></g><g fill="#aa2de8"><path d="M31 38v-2h-2v2h1z"/><path d="M31 34v2h2v-2h2v-2h-6v2h1z"/><path d="M29 36v-2h-2v2h1zm6 0h-2v2h2v-1z"/><path d="M35 36h2v-2h-2v1zm-4 4h-2v2h2v-1z"/><path d="M29 42h-2v2h2v-1z"/><path d="M27 40h2v-2h-2v-2h-2v6h2v-1zm6 4v-2h-2v2h-2v2h6v-2h-1z"/><path d="M33 40v2h2v-2h-1z"/><path d="M35 42v2h2v-2h-1zm10-22v-2h-2v2h1z"/><path d="M41 18v-2h-2v2h1zm4 4h2v-2h-2v1zm-8 14v2h-2v2h2v2h2v-6h-1zm11-2h-1v-4h-2v-4h-4v-2h-4v-2H27v2h-4v2h-4v4h-2v4h-2v10h2v4h2v4h4v2h4v2h10v-2h4v-2h4v-4h2v-4h2V34h-1zm-3 1v9h-2v2h-2v2h-2v2h-2v2H27v-2h-2v-2h-2v-2h-2v-2h-2V34h2v-2h2v-2h2v-2h2v-2h10v2h2v2h2v2h2v2h2v1zM25 60h-4v-2h-2v-2h-4v2h2v2h2v2h6v-1zm22-4h-2v2h-2v2h-4v2h6v-2h2v-2h2v-2h-1z"/><path d="M37 62H25v2h14v-2h-1zM19 22v-2h-2v2h1z"/><path d="M25 18v-2h-2v2h1zm-4 2v-2h-2v2h1zm8-4h8v-2H27v2h1z"/></g><g fill="#edd3fd"><path d="M17 24v2h2v-2h-1zm20 4H27v2h10v-1zm-14-8h-2v2h4v-2h-1z"/><path d="M39 18H25v2h14v-1zm-20 4v2h2v-2h-1z"/><path d="M43 20h-4v2h4v-1z"/><path d="M45 22h-2v2h2v-1zM19 52h-2v2h2v-1zm4-10v-8h-2v10h2v-1zm8-4v2h2v-2h-1zm-4 8h-2v2h2v-1z"/><path d="M25 44h-2v2h2v-1zm-4 10h-2v2h2v-1z"/><path d="M25 56h-4v2h4v-1zm18-2v2h2v-2h-1zm-6-8v2h2v-2h-1z"/><path d="M35 48h-8v2h10v-2h-1zm4-4v2h2v-2h-1zm-2 14H25v2h14v-2h-1z"/><path d="M41 56h-2v2h4v-2h-1zm6-32h-2v2h2v-1zm-2 28v2h2v-2h-1zm-4-16v8h2V34h-2v1z"/><path d="M39 34h2v-2h-2v1z"/><path d="M37 32h2v-2h-2v1zm-10 0v-2h-2v2h1z"/><path d="M25 34v-2h-2v2h1zm-8 16h-2v2h2v-1zm0 10h-2v2h2v-1zm30-10v2h2v-2h-1z"/><path d="M17 62v2h2v-2h-1zm28 0v2h2v-2h-1zM15 26v2h2v-2h-1zm33 0h-1v2h2v-2z"/><path d="M47 60v2h2v-2h-1z"/></g><g fill="#c260ff"><path d="M45 24h-2v-2h-4v-2H25v2h-4v2h-2v2h4v-2h4v-2h10v2h4v2h4v-1z"/><path d="M21 22v-2h-2v2h1zm16 4H27v2h10v-1zm6 10v8h2V34h-2v1zm-4-16h4v-2h-4v1z"/><path d="M33 38v-2h-2v2h1zm10-16h2v-2h-2v1zM21 42v-8h-2v10h2v-1zm-4-16v2h-2v6h2v-4h2v-4h-1zm2 26v-4h-2v-4h-2v6h2v2h1z"/><path d="M19 54h-2v-2h-2v4h4v-1zm4-10h-2v2h2v-1zm8-4v-2h-2v2h1z"/><path d="M31 40v2h2v-2h-1zm10 4v2h2v-2h-1z"/><path d="M33 40h2v-2h-2v1zm2 10h-8v2h10v-2h-1zm-16 4h2v2h4v2h14v-2h4v-2h2v-2h-4v2h-4v2H27v-2h-4v-2h-4v1z"/><path d="M21 56h-2v2h2v-1z"/><path d="M25 58h-4v2h4v-1zm18-2v2h2v-2h-1zM23 20h2v-2h-4v2h1z"/><path d="M27 18h12v-2H25v2h1zm21 4h-3v2h2v2h2v-4zM37 48v2h2v-2h-1z"/><path d="M39 46v2h2v-2h-1zm-14 0h-2v2h2v-1z"/><path d="M27 48h-2v2h2v-1zm14-14h2v-2h-2v1zm-4-4h2v-2h-2v1z"/><path d="M27 32h-2v2h-2v10h2v2h2v2h10v-2h2v-2h2V34h-2v-2h-2v-2H27v2zm1 2h1v-2h6v2h2v2h2v6h-2v2h-2v2h-6v-2h-2v-2h-2v-6h2v-2h1z"/><path d="M39 32h2v-2h-2v1zm-16 2v-2h-2v2h1z"/><path d="M25 32v-2h-2v2h1z"/><path d="M27 30v-2h-2v2h1zM17 58h-2v2h2v-1z"/><path d="M19 60h-2v2h2v-1zm28-6h-2v2h4v-4h-2v1zm-6 4h-2v2h4v-2h-1zm6 4v-2h-2v2h1z"/><path d="M37 60H25v2h14v-2h-1z"/><path d="M23 62h-4v2h6v-2h-1zm16 2h6v-2h-6v1zM17 24h2v-2h-4v4h2v-1zm28 2v4h2v4h2v-6h-2v-2h-1zm2 18v4h-2v4h2v-2h2v-6h-1zm2 16v-2h-2v2h1zm-34 2v2h2v-2h-1zm32 2h2v-2h-2v1z"/></g><path d="M34 7h-2v3h1V9h1V8h1V7z" fill="#aa2de8"/><g fill="#c260ff"><path d="M34 6V5h-1V4h-1v3h3V6z"/><path d="M30 7h-1v1h1v1h1v1h1V7h-1z"/></g><path d="M31 4v1h-1v1h-1v1h3V4z" fill="#dfacff"/><g fill="#141414"><path d="M41 14h-4v2h4v-1zm-8-2h-4v2h6v-2h-1z"/><path d="M37 11v-1h-2v2h2zm12 18v4h2v-4h-1zm2 8v-2h-2v4h2v-1zm0 16h-2v2h2v-1z"/><path d="M51 59h-2v2h2v-1zm0-33v-1h-2v2h2zm-2-4h2v-2h-2v1zm2 33v2h2v-2h-1z"/><path d="M51 45h-2v2h4v-2h-1zm0 16v3h2v-3h-1zm-2-42v-1h-4v2h4z"/><path d="M45 16h-4v2h4v-1zm9 23h-3v2h4v-2zM25 14h-2v2h4v-2h-1zm4-4h-2v2h2v-1zm-12 8h-2v2h4v-2h-1zm-4 11v4h2v-4h-1zm0 6v4h2v-4h-1zm0 18v2h2v-2h-1z"/><path d="M13 45h-2v2h4v-2h-1zm0 14v2h2v-2h-1zm0-34v2h2v-2h-1zm-2 30v2h2v-2h-1z"/><path d="M11 61v3h2v-3h-1zm0-22H9v2h4v-2h-1zm2-19v2h2v-2h-1zm8-4h-2v2h4v-2h-1z"/></g><g fill="#1e1e1e"><path d="M45 12h2v-2h-2V8h-6v4h-2v2h8v-1z"/><path d="M39 6h-2V4h-2V2h-6v2h-2v2h-2v2h2v2h2v2h6v-2h2V8h2V6zm-4 2v1h-1v1h-1v1h-2v-1h-1V9h-1V8h-1V6h1V5h1V4h1V3h2v1h1v1h1v1h1v2h-1zm15 10h1v-2h2v-2h-2v-2h-4v2h-2v4h4z"/><path d="M51 20v2h-2v3h6v-7h-4v1zm4 15h-4v4h6v-4h-1zm0 8h-4v-2h-2v4h4v2h2v-2h2v-2h-1zm0 10v-2h-2v-2h-4v4h2v2h2v2h2v-2h2v-2h-1zm0 6h-4v2h2v3h4v-5h-1zm1-32h-5v6h4v-2h2v-4zM23 8h-4v2h-2v2h2v2h8v-2h-2V8h-1zM13 49h-2v2H9v2H7v2h2v2h2v-2h2v-2h2v-4h-1zm0-8v2H7v2h2v2h2v-2h4v-4h-1zm-2 18H7v5h4v-3h2v-2h-1zm0-41H9v7h6v-3h-2v-4h-1z"/><path d="M17 14v-2h-4v2h-2v2h2v2h6v-4h-1zM9 31v2h4v-6H7v4h1zm0 8h4v-4H7v4h1z"/></g><path d="M35 12v2h2v-2h-1zm-2-3h1v1h-1z"/><path d="M34 8h1v1h-1zm3 0v4h2V8h-1z"/><path d="M35 8h1V6h-1v1zm6-1V6h-2v2h2z"/><path d="M34 5h1v1h-1z"/><path d="M33 4h1v1h-1zm16 17v-1h-2v2h2zm0 40v3h2v-3h-1zm2-22h-2v2h2v-1z"/><path d="M49 27v2h2v-2h-1zm2-7v-2h-2v2h1z"/><path d="M53 18h2v-4h-2v2h-2v2h1zm-10-4h-2v2h4v-2h-1z"/><path d="M47 13v-1h-2v2h2z"/><path d="M49 12v-2h-2v2h1zm4 21h-4v2h6v-2h-1zm0 24h-2v-2h-2v4h6v-2h-1zm0-16h-2v2h4v-2h-1zm0-16h-2v2h4v-2h-1z"/><path d="M55 24v1h2v-2h-2zm3 5h-1v2h-2v2h4v-4zm-1 26h-2v2h4v-2h-1zm0-10h-2v2h-6v2h6v2h2v2h2v-4h-2v-2h2v-2h-1zm0 16v3h2v-3h-1zm0-22h-2v2h4v-2h-1zM27 12v2h2v-2h-1zm4-2v1h2v-1h-1z"/><path d="M27 10V8h-2v4h2v-1zm3-1h1v1h-1z"/><path d="M29 8h1v1h-1zm-4-2h-2v2h2V7z"/><path d="M29 6h-1v2h1V7z"/><path d="M29 5h1v1h-1z"/><path d="M30 4h1v1h-1z"/><path d="M33 4V3h-2v1h1zM13 33H9v2h6v-2h-1zm0 22v2H9v2h6v-4h-1zm0-8H9v-2H5v2h2v2H5v4h2v-2h2v-2h6v-2h-1zm0 14v3h2v-3h-1zm0-22v2h2v-2h-1z"/><path d="M13 27v2h2v-2h-1zm-2 14H9v2h4v-2h-1z"/><path d="M13 25H9v2h4v-1zm2-5v2h2v-2h-1z"/><path d="M15 18h-2v2h2v-1z"/><path d="M13 16h-2v-2H9v4h4v-1zm8-2h-2v2h4v-2h-1z"/><path d="M19 12h-2v2h2v-1z"/><path d="M17 10h-2v2h2v-1zM9 31H7v-2H5v4h4v-1zm0 24H5v2h4v-1zm0-16H5v2h4v-1zm0-16H7v2h2v-1zM5 61v3h2v-3H6z"/><g fill="#323232"><path d="M45 8v2h2V8h-1zm-8-4v2h2V4h-1z"/><path d="M37 2h-2v2h2V3z"/><path d="M35 0h-6v2h6V1z"/><path d="M27 2v2h2V2h-1zm14 4v2h2V6h-1zm12 7v-1h-2v2h2z"/><path d="M51 10h-2v2h2v-1zm4 39h-2v2h2v-1z"/><path d="M57 51h-2v2h2v-1zm0-28v-5h-2v5h1zm0 10h-2v2h2v4h2v-6h-1zm0 24h-2v2h2v2h2v-4h-1z"/><path d="M57 53v2h2v-2h-1zm0-6v2h2v-2h-1zm0-6h-2v2h2v2h2v-4h-1zm1-16h-3v2h2v2h2v-4zM17 8v2h2V8h-1zm8-4v2h2V4h-1zm-4 2v2h2V6h-1zm-10 6v2h2v-2h-1z"/><path d="M13 10v2h2v-2h-1zM9 49v2h2v-2h-1z"/><path d="M7 51v2h2v-2H8zm0 6H5v4h2v-2h2v-2H8zm2-34v-5H7v5h1zm-2 6v-2h2v-2H5v4h1z"/><path d="M7 49v-2H5v2h1zm-2 4v2h2v-2H6zm2-8v-2h2v-2H5v4h1zm0-6v-4h2v-2H5v6h1z"/></g>'

  ]
  sizes = svgs.map((value) => value.length)
  svgs = svgs.join('')
  console.log('Uploading Items SVG...')
  await svgStorageFacet.storeItemsSVG(svgs, sizes)
  console.log('Uploaded Items SVG')

  // ----------------------------------------------------------------
  // Mint Aavegotchi with SVG Layers

  // let svgLayers = [0, 1, 2, 3]
  // svgLayers = svgLayers.map(value => {
  //   value = ethers.utils.hexlify(value)
  //   value = value.slice(2)
  //   if (value.length === 2) {
  //     value = '00' + value
  //   }
  //   return value
  // })
  // svgLayers = '0x' + svgLayers.join('').padEnd(64, '0')
  // await aavegotchiNFT.mintAavegotchi(svgLayers)
  // console.log('Mint Aavegotchi with SVG Layers')

  // ----------------------------------------------------------------
  // Mint Wearables
  // await wearables.mintWearables()
  // console.log('Minted one set of wearables')

  // ----------------------------------------------------------------
  // Add Wearables
  // transferToParent(address _from, address _toContract, uint _toTokenId, uint _id, uint _value)
  // function wearableId (id) {
  //   return ethers.BigNumber.from(id).mul(ethers.BigNumber.from(2).pow(240))
  // }
  // const id1 = wearableId(1)
  // const id2 = wearableId(2)
  // const id3 = wearableId(3)
  // await wearables.transferToParent(address, aavegotchiDiamond.address, 0, id1, 1)
  // await wearables.transferToParent(address, aavegotchiDiamond.address, 0, id2, 1)
  // await wearables.transferToParent(address, aavegotchiDiamond.address, 0, id3, 1)
  // console.log('Added wearables')

  // ----------------------------------------------------------------
  // Send some ether
  // const tx = accounts[0].sendTransaction({
  //   to: '0x0b22380B7c423470979AC3eD7d3c07696773dEa1',
  //   value: ethers.utils.parseEther('0.1')
  // })

  // ----------------------------------------------------------------
  // Get the combined SVG of an Aavegotchi.

  // const svg = await aavegotchiNFT.getAavegotchiSVG(0)
  // console.log('Get the combined SVG of an Aavegotchi.')
  // console.log()
  // console.log(svg)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

exports.deployProject = main
