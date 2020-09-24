/* global ethers */

// We require the Buidler Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.
// eslint-disable-next-line no-unused-vars
const bre = require('@nomiclabs/buidler')

async function main () {
  // Buidler always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await bre.run('compile');

  const accounts = await ethers.getSigners()
  const account = await accounts[0].getAddress()
  console.log('Account: ' + account)
  console.log('---')

  const DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet')
  const DiamondLoupeFacet = await ethers.getContractFactory('DiamondLoupeFacet')
  const OwnershipFacet = await ethers.getContractFactory('OwnershipFacet')

  const diamondCutFacet = await DiamondCutFacet.deploy()
  console.log('Deploying DiamondCutFacet')

  await diamondCutFacet.deployed()
  console.log('DiamondCutFacet deployed')
  console.log('---')

  const diamondLoupeFacet = await DiamondLoupeFacet.deploy()
  console.log('Deploying DiamondLoupeFacet')

  await diamondLoupeFacet.deployed()
  console.log('DiamondLoupeFacet deployed')
  console.log('---')

  const ownershipFacet = await OwnershipFacet.deploy()
  console.log('Deploying OwershipFacet')

  await ownershipFacet.deployed()
  console.log('OwershipFacet deployed')
  console.log('---')

  /*

  const [diamondCutFacet, diamondLoupeFacet, ownershipFacet] =
    await Promise.all([DiamondCutFacet.deploy(), DiamondLoupeFacet.deploy(), OwnershipFacet.deploy()])

  await Promise.all([
    diamondCutFacet.deployed(),
    diamondLoupeFacet.deployed(),
    ownershipFacet.deployed()
  ])
  */

  // We get the contract to deploy
  const AavegotchiDiamond = await ethers.getContractFactory('Aavegotchi')
  // const aavegotchiDiamond = AavegotchiDiamond.attach('0xFCB5348111665Cf95a777f0c4FCA768E05601760')
  const aavegotchiDiamond = await AavegotchiDiamond.deploy([
    diamondCutFacet.address,
    diamondLoupeFacet.address,
    ownershipFacet.address
  ])
  console.log('Aavegotchi diamond deployed')

  await aavegotchiDiamond.deployed()
  console.log('Deployed Aavegotchi diamond:')
  console.log(aavegotchiDiamond.address)
  console.log('---')
  // kovan demo: 0x201Df88D8d79ACA0AA6360F02eb9dD8aefdB1dfb

  const IAavegotchiDiamond = await ethers.getContractFactory('IAavegotchiDiamond')
  const iAavegotchiDiamond = IAavegotchiDiamond.attach(aavegotchiDiamond.address)
  const ghstDiamondAddress = await iAavegotchiDiamond.ghstAddress()
  console.log('Deployed GHST diamond: ')
  console.log(ghstDiamondAddress)
  console.log('---')
  // const IGHSTDiamond = await ethers.getContractFactory('IGHSTDiamond')
  // const iGHSTDiamond = IGHSTDiamond.attach(ghstDiamondAddress)

  // iGHSTDiamond.mint()

  const SVGStorage = await ethers.getContractFactory('SVGStorage')
  const svgStorage = SVGStorage.attach(aavegotchiDiamond.address)

  // const AavegotchiNFT = await ethers.getContractFactory('AavegotchiNFT')
  // const aavegotchiNFT = AavegotchiNFT.attach(aavegotchiDiamond.address)

  // const Wearables = await ethers.getContractFactory('Wearables')
  // const wearables = Wearables.attach(aavegotchiDiamond.address)

  // const accounts = await ethers.getSigners()
  // const address = await accounts[0].getAddress()

  // ----------------------------------------------------------------
  // Upload SVG layers
  let svgs
  let sizes
  /*
  svgs = [
    // background eth
    '<defs fill="#fff"><pattern id="a" patternUnits="userSpaceOnUse" width="4" height="4"><path d="M0 0h1v1H0zm2 2h1v1H2z"/></pattern><pattern id="b" patternUnits="userSpaceOnUse" x="0" y="0" width="2" height="2"><path d="M0 0h1v1H0z"/></pattern><pattern id="c" patternUnits="userSpaceOnUse" x="-2" y="0" width="8" height="1"><path d="M0 0h1v1H0zm2 0h1v1H2zm2 0h1v1H4z"/></pattern><pattern id="d" patternUnits="userSpaceOnUse" x="0" y="0" width="4" height="4"><path d="M0 0h1v1H0zm0 2h1v1H0zm1 0V1h1v1zm1 0h1v1H2zm0-1h1V0H2zm1 2h1v1H3z"/></pattern><pattern id="e" patternUnits="userSpaceOnUse" width="64" height="32"><path d="M4 4h1v1H4zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1z"/><path fill="url(#a)" d="M0 8h64v7H0z"/><path fill="url(#b)" d="M0 16h64v1H0z"/><path fill="url(#c)" d="M0 18h64v1H0z"/><path fill="url(#b)" d="M22 18h15v1H22zM0 20h64v3H0z"/><path fill="url(#d)" d="M0 24h64v8H0z"/></pattern><mask id="f"><path fill="url(#e)" d="M0 0h64v32H0z"/></mask></defs><path fill="#c260ff" d="M0 0h64v32H0z"/><path fill="#dea8ff" mask="url(#f)" d="M0 0h64v32H0z"/><path fill="#dea8ff" d="M0 32h64v32H0z"/><path mask="url(#f)" fill="#c260ff" transform="matrix(1 0 0 -1 0 64)" d="M0 0h64v32H0z"/>',
    // body eth
    '<g fill="#64438e"><path d="M21 12h2v-2h-4v2h1z"/><path d="M19 14v-2h-2v2h1zm6-4h2V8h-4v2h1z"/><path d="M29 8h8V6H27v2h1zm16 6h2v-2h-2v1z"/><path d="M48 14h-1v39h-2v2h4V14zm-11-4h4V8h-4v1z"/><path d="M41 12h4v-2h-4v1zM17 53V14h-2v41h4v-2h-1z"/><path d="M24 51h-5v2h5v-1z"/><path d="M27 53h-3v2h5v-2h-1zm18-2h-5v2h5v-1z"/><path d="M35 51h-6v2h6v-1z"/><path d="M38 53h-3v2h5v-2h-1z"/></g><g fill="#edd3fd"><path d="M18 43v6h2v-1h2v1h2v2h-5v2h-2V14h2v1h-1v26z"/><path d="M27 51h-3v2h5v-2h-1zm11 0h-3v2h5v-2h-1z"/><path d="M35 49h-2v-1h-2v1h-2v2h6v-1zM25 11h2v-1h-4v1h1zm-4 2h2v-1h-4v1h1zm24 31v5h-1v-1h-2v1h-2v2h5v2h2V14h-2v29z"/><path d="M37 8H27v1h5v1h5V9zm8 4h-4v2h4v-1z"/><path d="M41 10h-4v2h4v-1z"/></g><path d="M44 14h-3v-2h-4v-2h-5V9h-5v2h-4v2h-4v2h-1v34h2v-1h2v1h2v2h5v-2h2v-1h2v1h2v2h5v-2h2v-1h2v1h1V14z" fill="#fff"/>',
    // eyes
    '<g fill="#64438e"><path d="M23 28v2h4v-2h2v-4h-2v-2h-4v2h-2v4h1zm12-4v4h2v2h4v-2h2v-4h-2v-2h-4v2h-1z"/></g>',
    // mouth
    '<g fill="#64438e"><path d="M29 32h-2v2h2v-1z"/><path d="M33 34h-4v2h6v-2h-1z"/><path d="M36 32h-1v2h2v-2z"/></g>',
    // hands
    '<g fill="#64438e"><path d="M19 42h1v1h-1zm1-6h1v1h-1z"/><path d="M21 37h1v1h-1zm5 3v4h1v-4zm-5 3h-1v1h2v-1z"/><path d="M24 44h-2v1h4v-1h-1zm1-5h-1v1h2v-1z"/><path d="M23 38h-1v1h2v-1z"/></g><g fill="#edd3fd"><path d="M19 43h1v1h-1zm5 2h-2v1h4v-1h-1z"/><path d="M27 41v3h1v-3zm-6 3h-1v1h2v-1z"/><path d="M26 44h1v1h-1zm-7-3h-1v2h1v-1z"/></g><g fill="#64438e"><path d="M44 42h1v1h-1zm-1-6h1v1h-1z"/><path d="M42 37h1v1h-1z"/><path d="M42 39v-1h-2v1h1zm0 4v1h2v-1h-1z"/><path d="M40 44h-2v1h4v-1h-1z"/><path d="M38 42v-2h-1v4h1v-1z"/><path d="M40 40v-1h-2v1h1z"/></g><g fill="#edd3fd"><path d="M42 44v1h2v-1h-1zm-5-2v-1h-1v3h1v-1z"/><path d="M40 45h-2v1h4v-1h-1z"/><path d="M37 44h1v1h-1zm7-1h1v1h-1z"/></g>'
  ]
  sizes = svgs.map(value => value.length)
  svgs = svgs.join('')
  const p1 = svgStorage.storeAavegotchiLayersSVG(svgs, sizes)

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
  const p2 = svgStorage.storeWearablesSVG(svgs, sizes)
*/

  svgs = [
    // portal
    '<g fill="#c260ff"><path d="M39.95 19.55h-1.08v-1.07h-2.14V17.4h-7.5v1.07h-2.15v1.07H26v1.08h2.14v-1.08h2.15v-1.07h5.36v1.07h2.15v1.08h2.15v-.54zM26 18.48h1.07V17.4H26v.53zm5.36 3.22h4.3v-1.07H30.3v1.07h.54zm7.5 4.3v4.3h1.08v-5.36h-1.08v.54z"/><path d="M36.73 16.34v1.07h2.14v-1.07h-1.6zm-4.3 10.72h1.07V26h-1.07v.54z"/><path d="M38.87 17.4v1.07h1.08V17.4h-.54zm-11.8 12.88v-5.36H26v5.36h.53zm-2.15-5.36v-2.15H26v-2.14h-1.08v1.07h-1.07v3.22h.54zm0 8.58v1.08H26v-2.15h-1.08v-2.15h-1.07v3.22h.54z"/><path d="M24.92 36.72H26v-1.07h-1.08v-1.07h-1.07v2.14h.54zm3.22-6.44h-1.07v1.08h1.07v-.54zm4.3-2.14v-1.08h-1.08v1.08h.54z"/><path d="M33.5 28.14h-1.07v1.07h1.07v-.54zm4.3 2.14v1.08h1.07v-1.08h-.53z"/><path d="M33.5 27.06v1.08h1.07v-1.08h-.54zm1.08 6.44h-4.3v1.08h5.36V33.5h-.53zm-7.5 2.15v1.07h2.15v1.07h7.5v-1.07h2.14v-1.07h1.08v-1.07H37.8v1.07h-2.15v1.07H30.3v-1.07h-2.15v-1.07H26v1.07h.53z"/><path d="M27.07 36.72H26v1.07h1.07v-.53z"/><path d="M29.22 37.8h-2.15v1.08h2.15v-.54zm9.65-1.08v1.07h1.08v-1.07h-.54zM27.07 17.4h2.15v-1.07h-2.15v.53z"/><path d="M29.22 16.34h7.5v-1.08h-7.5v.54zm10.73 2.14v1.07h1.07v1.08h1.07v-2.15h-1.6zm-4.3 13.95v1.07h1.08v-1.07h-.54z"/><path d="M36.73 31.36v1.07h1.07v-1.07h-.54zm-7.5 0h-1.08v1.07h1.08v-.54zm1.08 1.07h-1.07v1.07h1.07v-.53zm7.5-7.5h1.07v-1.07H37.8v.53zm-2.15-2.15h1.08V21.7h-1.08v.54z"/><path d="M29.22 30.28v1.08h1.08v1.08h5.4v-1.08h1.08v-1.08h1.08V24.9h-1.08v-1.08H35.7v-1.08h-5.42v1.08H29.2v1.08h-1.08v5.4h1.1zm0-1.6v-2.7h1.08V24.9h1.08v-1.08h3.24v1.08h1.08v1.08h1.08v3.24H35.7v1.08h-1.08v1.08h-3.26V30.3h-1.08v-1.08H29.2v-.55z"/><path d="M36.73 23.85h1.07v-1.08h-1.07v.54zm-8.6 1.07v-1.07h-1.07v1.07h.54z"/><path d="M29.22 23.85v-1.08h-1.08v1.08h.54zm1.08-1.08V21.7h-1.07v1.07h.53zm-5.38 16.1V37.8h-1.07v1.08h.54z"/><path d="M26 38.87h-1.08v1.07H26v-.54zm15.02-4.3v1.07h-1.07v1.07h2.14v-2.14h-.54zM37.8 37.8h-1.07v1.08h2.14V37.8h-.53zm2.15 1.07v1.07h1.07v-1.07h-.54z"/><path d="M36.73 38.87h-7.5v1.07h7.5v-.54z"/><path d="M29.22 39.94H26V41h3.22v-.53zm10.73 0h-3.22V41h3.22v-.53zm-15.03-19.3v-1.08H26v-1.07h-2.15v2.15h.54zm16.1 1.07v-1.07h-1.07v2.14h1.07v2.15h1.07V21.7h-.54zm0 8.58v2.15h-1.07v2.15h1.07V33.5h1.07v-3.22h-.54zm0 7.52v1.08h1.07V37.8h-.54z"/></g><g fill="#aa2de8"><path d="M32.44 27.06V26h-1.08v1.07h.54z"/><path d="M32.44 24.92V26h1.07v-1.07h1.07v-1.07h-3.22v1.07h.54z"/><path d="M31.36 26v-1.07H30.3V26h.54zm2.14 1.06h1.07V26H33.5v.54z"/><path d="M34.58 26h1.07v-1.07h-1.07v.54zm-3.22 3.2h1.08v-1.07h-1.08v.53z"/><path d="M31.36 29.2H30.3v1.07h1.07v-.53z"/><path d="M30.3 29.2v-1.07h1.07v-1.08H30.3V26h-1.07v3.22h.53zm3.2 1.08V29.2h-1.07v1.07h-1.08v1.08h3.22v-1.08h-.54z"/><path d="M33.5 28.14v1.07h1.07v-1.07h-.54z"/><path d="M34.58 29.2v1.07h1.07V29.2h-.53zm4.3-11.8h1.08v-1.07h-1.08v.53z"/><path d="M36.73 16.34h1.07v-1.08h-1.07v.54zm3.22 2.14h1.07V17.4h-1.07v.53zm-4.3 8.58h-1.07v1.08h1.07v1.07h1.08V26h-1.08v.54zm-10.73 3.22v2.16H26v2.16h2.16v1.08h2.16v1.08h5.4v-1.08h2.16V34.6h2.16v-2.18h1.08v-2.16h1.08V24.9h-1.08v-2.16h-1.08v-2.12H37.8v-1.08h-2.16v-1.08h-5.36v1.08h-2.16v1.08H26v2.16h-1.08v2.16h-1.08v5.4h1.08zm1.08-.53V24.9h1.08v-1.08h1.08v-1.08h1.08V21.7h1.08v-1.08h5.4v1.08h1.08v1.08h1.08v1.08h1.08v1.08h1.08v5.4h-1.08v1.08H37.8v1.08h-1.08v1.08h-1.08v1.08h-5.36V33.5H29.2v-1.08h-1.08v-1.08h-1.08v-1.08H26v-.5zm-1.08 8.05v1.08H26v1.07h3.22v-1.07h-2.15V37.8H26v-1.07h-2.15v1.07h.54zm16.1-1.08h-1.07v1.07h-1.08v1.08h-2.14v1.07h3.22v-1.07h1.07V37.8h1.07v-1.07h-.54z"/><path d="M36.73 39.94h-7.5V41h7.5v-.53zM26 18.48V17.4h-1.08v1.07h.54z"/><path d="M27.07 17.4v-1.07H26v1.07h.53zm2.15-1.06v-1.08h-1.08v1.08h.54zm2.14-1.08h4.3V14.2H30.3v1.07h.54z"/></g><g fill="#9800cd"><path d="M30.3 27.06h1.07V26H30.3v.54z"/><path d="M31.36 26h1.08v-1.07h-1.08v.54zm2.14-1.08V26h1.07v-1.07h-.54z"/><path d="M34.58 26v1.07h1.07V26h-.53zm-2.14 4.28V29.2h-1.08v1.07h.54z"/><path d="M31.36 29.2v-1.07H30.3v1.07h.54zm3.22 0H33.5v1.07h1.07v-.53z"/><path d="M35.65 28.14h-1.07v1.07h1.07v-.54z"/></g><g fill="#edd3fd"><path d="M26 19.55h-1.08v1.08H26v-.54zm4.3 3.22h5.36V21.7H30.3v.54zm-2.16-4.3h1.08V17.4h-2.15v1.07h.54zm2.16-1.08h6.44v-1.07h-7.5v1.07h.53z"/><path d="M27.07 19.55v-1.07H26v1.07h.53zm9.66-1.07h2.14V17.4h-2.14v.53z"/><path d="M38.87 19.55h1.08v-1.07h-1.08v.54zM26 34.58h-1.08v1.07H26v-.54zM27.07 26v4.3h1.07v-5.36h-1.07v.54zm6.43 2.14v-1.08h-1.07v1.08h.53z"/><path d="M30.3 32.43v-1.07h-1.07v1.07h.53zm-1.08-1.07v-1.08h-1.08v1.08h.54zm-2.15 5.36v-1.07H26v1.07h.53z"/><path d="M28.14 37.8h1.08v-1.07h-2.15v1.07h.54zm10.73-2.15v1.07h1.08v-1.07h-.54zm-2.14-4.3h-1.08v1.07h1.08v-.54z"/><path d="M35.65 32.43H30.3v1.07h5.36v-.53zm2.15-2.15h-1.07v1.08h1.07v-.54zm-7.5 8.6h6.44V37.8h-7.5v1.08h.53z"/><path d="M38.87 36.72h-2.14v1.07h2.14v-.53zm2.15-16.1v-1.08h-1.07v1.08h.53zm-1.07 15.02h1.07v-1.07h-1.07v.53zM37.8 24.92v5.36h1.07v-5.36h-.53z"/><path d="M36.73 23.85v1.07h1.07v-1.07h-.54z"/><path d="M35.65 22.77v1.08h1.08v-1.08h-.54zm-6.43 1.08h1.07v-1.08h-1.07v.54z"/><path d="M28.14 24.92h1.08v-1.07h-1.08v.53zm-3.22 9.66V33.5h-1.07v1.08h.54zm0 5.36v-1.07h-1.07v1.07h.54zm16.1-6.44v1.08h1.07V33.5h-.54z"/><path d="M26 39.94h-1.08V41H26v-.53zm15.02 0h-1.07V41h1.07v-.53zM24.92 21.7v-1.07h-1.07v1.07h.54zm16.1-1.07v1.07h1.07v-1.07h-.54z"/><path d="M42.1 38.87h-1.07v1.07h1.07v-.54z"/></g><path d="M34.04 10.43h-1.07v1.6h.54v-.53h.53v-.54h.54v-.54z" fill="#aa2de8"/><g fill="#c260ff"><path d="M34.04 9.9v-.54h-.53v-.53h-.54v1.6h1.6V9.9z"/><path d="M31.9 10.43h-.54v.54h.54v.54h.54v.53h.53v-1.6h-.53z"/></g><path d="M32.44 8.83v.53h-.54v.54h-.54v.53h1.6v-1.6z" fill="#dfacff"/><g fill="#141414"><path d="M37.8 14.2h-2.15v1.07h2.15v-.53zm-4.3-1.08h-2.15v1.07h3.22v-1.07h-.54z"/><path d="M35.65 12.58v-.54h-1.07v1.08h1.07zm6.45 9.66v2.14h1.07v-2.14h-.53zm1.06 4.3v-1.07H42.1v2.14h1.07v-.54zm0 8.57H42.1v1.07h1.07v-.53z"/><path d="M43.16 38.33H42.1v1.07h1.07v-.53zm0-17.7v-.54H42.1v1.07h1.07zm-1.06-2.15h1.07V17.4H42.1v.53zm1.06 17.7v1.08h1.08v-1.08h-.54z"/><path d="M43.16 30.82H42.1v1.07h2.15v-1.07h-.54zm0 8.58V41h1.08v-1.6h-.54zM42.1 16.87v-.53h-2.14v1.07h2.14zm-2.15-1.6H37.8v1.08h2.15v-.54zm4.82 12.34h-1.6v1.07h2.15V27.6zM29.22 14.2h-1.08v1.07h2.15V14.2h-.54zm2.14-2.16H30.3v1.08h1.07v-.54zm-6.44 4.3h-1.07v1.07H26v-1.07h-.54zm-2.14 5.9v2.14h1.07v-2.14h-.53zm0 3.22v2.14h1.07v-2.14h-.53zm0 9.64v1.07h1.07V35.1h-.53zm0-4.28H21.7v1.07h2.14v-1.07h-.53zm0 7.5v1.07h1.07v-1.07h-.53zm0-18.23v1.07h1.07V20.1h-.53zM21.7 36.18v1.08h1.07v-1.08h-.54zm0 3.22V41h1.07v-1.6h-.54z"/><path d="M21.7 27.6h-1.08v1.07h2.15V27.6h-.54zm1.08-10.2v1.07h1.07V17.4h-.53zm4.3-2.14H26v1.08h2.14v-1.08h-.53z"/></g><g fill="#1e1e1e"><path d="M39.95 13.12h1.07v-1.08h-1.07v-1.07h-3.22v2.15h-1.08v1.07h4.3v-.54z"/><path d="M36.73 9.9h-1.08V8.83h-1.08V7.75h-3.2v1.08H30.3V9.9h-1.1v1.08h1.08v1.08h1.08v1.08h3.24v-1.08h1.08v-1.08h1.08V9.9zm-2.15 1.07v.54h-.54v.54h-.54v.54h-1.08v-.54h-.52v-.54h-.54v-.54h-.54V9.9h.54v-.54h.54v-.53h.54V8.3h1.08v.54h.54v.54h.54v.53h.54V11h-.56zm8.05 5.37h.53v-1.08h1.08V14.2h-1.08v-1.07h-2.14v1.07h-1.07v2.15h2.14z"/><path d="M43.16 17.4v1.07H42.1v1.6h3.22v-3.75h-2.15v.53zm2.14 8.06h-2.15v2.14h3.22v-2.14h-.53zm0 4.3h-2.15v-1.08H42.1v2.15h2.15v1.07h1.07v-1.07h1.07v-1.07h-.53zm0 5.35v-1.07h-1.07v-1.07H42.1v2.14h1.07v1.07h1.08v1.08h1.07v-1.08h1.07V35.1h-.53zm0 3.23h-2.15v1.07h1.08V41h2.14v-2.68h-.53zm.55-17.17h-2.7v3.22h2.15V23.3h1.07v-2.15zm-17.7-10.2H26v1.07h-1.08v1.08H26v1.07h4.3v-1.07h-1.07v-2.15h-.54zm-5.36 22H21.7v1.07h-1.08v1.07h-1.07v1.07h1.07v1.08h1.08v-1.08h1.07V35.1h1.07v-2.14h-.53zm0-4.3v1.08h-3.22v1.07h1.07v1.07h1.08v-1.07h2.14v-2.15h-.53zm-1.08 9.66h-2.15V41h2.15v-1.6h1.07v-1.07h-.54zm0-22h-1.08v3.75h3.22v-1.6h-1.07v-2.14h-.54z"/><path d="M24.92 14.2v-1.07h-2.14v1.07H21.7v1.07h1.07v1.08H26V14.2h-.54zm-4.3 9.1v1.07h2.15v-3.22h-3.22v2.15h.54zm0 4.3h2.15v-2.14h-3.22v2.14h.54z"/></g><path d="M34.58 13.12v1.07h1.07v-1.07h-.53zM33.5 11.5h.54v.54h-.54z"/><path d="M34.04 10.97h.54v.54h-.54zm1.6 0v2.15h1.08v-2.15h-.54z"/><path d="M34.58 10.97h.54V9.9h-.54v.53zm3.22-.54V9.9h-1.07v1.07h1.07z"/><path d="M34.04 9.36h.54v.54h-.54z"/><path d="M33.5 8.83h.54v.54h-.54zm8.6 9.1v-.53h-1.07v1.07h1.07zm0 21.46V41h1.07v-1.6h-.53zm1.06-11.8H42.1v1.07h1.07v-.53zm-1.06-6.44v1.08h1.07v-1.08h-.53zm1.06-3.76v-1.07H42.1v1.07h.54z"/><path d="M44.24 16.34h1.07V14.2h-1.07v1.07h-1.08v1.08h.54zm-5.37-2.14H37.8v1.07h2.15V14.2h-.54z"/><path d="M41.02 13.65v-.53h-1.07v1.07h1.07z"/><path d="M42.1 13.12v-1.08h-1.07v1.08h.53zm2.14 11.26H42.1v1.08h3.22v-1.08h-.54zm0 12.88h-1.08v-1.08H42.1v2.15h3.22v-1.07h-.54zm0-8.6h-1.08v1.08h2.15v-1.08h-.54z"/><path d="M44.24 20.1h-1.08v1.07h2.15V20.1h-.54zm1.06-.55v.54h1.07v-1.07H45.3zm1.62 2.7h-.54v1.07H45.3v1.07h2.15v-2.14zm-.54 13.94H45.3v1.08h2.15v-1.08h-.54zm0-5.36H45.3v1.07h-3.2v1.08h3.22v1.07h1.07v1.07h1.08v-2.14H46.4V31.9h1.08v-1.07h-.54zm0 8.58V41h1.08v-1.6h-.54zm0-11.8H45.3v1.07h2.15V27.6h-.54zM30.3 13.12v1.07h1.07v-1.07h-.53z"/><path d="M32.44 12.04v.54h1.07v-.54h-.54zm-2.14 0v-1.07h-1.07v2.15h1.07v-.54z"/><path d="M31.9 11.5h.54v.54h-.54z"/><path d="M31.36 10.97h.54v.54h-.54zM29.22 9.9h-1.08v1.07h1.08v-.54z"/><path d="M31.36 9.9h-.53v1.07h.53v-.54z"/><path d="M31.36 9.36h.54v.54h-.54z"/><path d="M31.9 8.83h.54v.54h-.54z"/><path d="M33.5 8.83V8.3h-1.07v.54h.53zM22.78 24.38h-2.15v1.08h3.22v-1.08h-.53zm0 11.8v1.08h-2.15v1.07h3.22v-2.15h-.53zm0-4.28h-2.15v-1.07H18.5v1.07h1.07v1.08H18.5v2.14h1.07v-1.07h1.07v-1.07h3.22V31.9h-.53zm0 7.5V41h1.07v-1.6h-.53zm0-11.8v1.07h1.07V27.6h-.53zm0-6.44v1.08h1.07v-1.08h-.53zm-1.08 7.5h-1.08v1.08h2.15v-1.08h-.54z"/><path d="M22.78 20.1h-2.15v1.07h2.15v-.53zm1.07-2.7v1.07h1.07V17.4h-.53z"/><path d="M23.85 16.34h-1.07v1.07h1.07v-.54zm-1.07-1.08H21.7V14.2h-1.08v2.15h2.15v-.54zm4.3-1.06H26v1.07h2.14V14.2h-.53z"/><path d="M26 13.12h-1.08v1.07H26v-.54z"/><path d="M24.92 12.04h-1.07v1.08h1.07v-.54zm-4.3 11.26h-1.07v-1.07H18.5v2.14h2.14v-.53zm0 12.88H18.5v1.08h2.14v-.54zm0-8.58H18.5v1.07h2.14v-.53zm0-8.58h-1.07v1.07h1.07v-.54zM18.5 39.4V41h1.07v-1.6h-.54z"/><g fill="#323232"><path d="M39.95 10.97v1.07h1.07v-1.07h-.54zm-4.3-2.14V9.9h1.08V8.83h-.54z"/><path d="M35.65 7.75h-1.07v1.08h1.07V8.3z"/><path d="M34.58 6.68h-3.22v1.07h3.22v-.53z"/><path d="M30.3 7.75v1.08h1.07V7.75h-.53zm7.5 2.15v1.07h1.07V9.9h-.53zm6.44 3.75v-.53h-1.08v1.07h1.08z"/><path d="M43.16 12.04H42.1v1.08h1.07v-.54zm2.14 20.93h-1.07v1.07h1.07v-.54z"/><path d="M46.38 34.04H45.3v1.07h1.07v-.53zm0-15.02v-2.68H45.3v2.68h.54zm0 5.36H45.3v1.08h1.07v2.14h1.08v-3.22h-.54zm0 12.88H45.3v1.07h1.07v1.07h1.08v-2.14h-.54zm0-2.16v1.07h1.08V35.1h-.54zm0-3.2v1.08h1.08V31.9h-.54zm0-3.23H45.3v1.08h1.07v1.07h1.08v-2.15h-.54zm.54-8.57h-1.6v1.07h1.07v1.08h1.08V20.1zm-22-9.13v1.07H26v-1.07h-.54zm4.3-2.14V9.9h1.07V8.83h-.54zM27.07 9.9v1.07h1.07V9.9h-.53zm-5.37 3.22v1.07h1.07v-1.07h-.54zm1.08-1.08v1.08h1.07v-1.08h-.53zm-2.15 20.93v1.07h1.08v-1.07h-.54z"/><path d="M19.56 34.04v1.07h1.07v-1.07h-.53zm0 3.22H18.5v2.14h1.07v-1.07h1.07v-1.07h-.53zm1.07-18.24v-2.68h-1.07v2.68h.54zm-1.07 3.22v-1.08h1.07V20.1H18.5v2.15h.53z"/><path d="M19.56 32.97V31.9H18.5v1.08h.53zM18.5 35.1v1.07h1.07V35.1h-.54zm1.06-4.28v-1.07h1.07v-1.08H18.5v2.15h.53zm0-3.22v-2.14h1.07v-1.08H18.5v3.22h.53z"/></g>'
  ]
  sizes = svgs.map(value => value.length)
  svgs = svgs.join('')
  const p3 = await svgStorage.storeItemsSVG(svgs, sizes)

  // await Promise.all([p1, p2, p3])
  // console.log('Uploaded Aavegotchi SVG Layers')
  // console.log('Uploaded Wearables SVG')
  console.log('Uploaded Items SVG')
  // testing minting portals

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
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
