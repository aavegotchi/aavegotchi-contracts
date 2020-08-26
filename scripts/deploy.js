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

  // We get the contract to deploy

  const SVGStorage = await ethers.getContractFactory('SVGStorage')
  const svgStorage = SVGStorage.attach('0x4fe23a33922BcC5e560fdd74A84cDDe4D2BdaaAC')
  // const svgStorage = await SVGStorage.deploy()
  // await svgStorage.deployed()
  // console.log()
  // console.log('Deployed SVGStorage contract.')
  // console.log(svgStorage.address)
  // kovan: 0x4fe23a33922BcC5e560fdd74A84cDDe4D2BdaaAC

  const AavegotchiDiamond = await ethers.getContractFactory('Aavegotchi')
  const aavegotchiDiamond = AavegotchiDiamond.attach('0xFCB5348111665Cf95a777f0c4FCA768E05601760')
  // const aavegotchiDiamond = await AavegotchiDiamond.deploy(svgStorage.address)
  // await aavegotchiDiamond.deployed()
  // console.log('Deployed Aavegotchi contract:')
  // console.log(aavegotchiDiamond.address)
  // kovan: 0xFCB5348111665Cf95a777f0c4FCA768E05601760
  // ----------------------------------------------------------------
  // Upload SVG layers

  let svgs = [
    // background eth
    '<defs fill="#fff"><pattern id="a" patternUnits="userSpaceOnUse" width="4" height="4"><path d="M0 0h1v1H0zm2 2h1v1H2z"/></pattern><pattern id="b" patternUnits="userSpaceOnUse" x="0" y="0" width="2" height="2"><path d="M0 0h1v1H0z"/></pattern><pattern id="c" patternUnits="userSpaceOnUse" x="-2" y="0" width="8" height="1"><path d="M0 0h1v1H0zm2 0h1v1H2zm2 0h1v1H4z"/></pattern><pattern id="d" patternUnits="userSpaceOnUse" x="0" y="0" width="4" height="4"><path d="M0 0h1v1H0zm0 2h1v1H0zm1 0V1h1v1zm1 0h1v1H2zm0-1h1V0H2zm1 2h1v1H3z"/></pattern><pattern id="e" patternUnits="userSpaceOnUse" width="64" height="32"><path d="M4 4h1v1H4zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1z"/><path fill="url(#a)" d="M0 8h64v7H0z"/><path fill="url(#b)" d="M0 16h64v1H0z"/><path fill="url(#c)" d="M0 18h64v1H0z"/><path fill="url(#b)" d="M22 18h15v1H22zM0 20h64v3H0z"/><path fill="url(#d)" d="M0 24h64v8H0z"/></pattern><mask id="f"><path fill="url(#e)" d="M0 0h64v32H0z"/></mask></defs><path fill="#c260ff" d="M0 0h64v32H0z"/><path fill="#dea8ff" mask="url(#f)" d="M0 0h64v32H0z"/><path fill="#dea8ff" d="M0 32h64v32H0z"/><path mask="url(#f)" fill="#c260ff" transform="matrix(1 0 0 -1 0 64)" d="M0 0h64v32H0z"/>',
    // body eth
    '<g fill="#64438e"><path d="M21 12h2v-2h-4v2h1z"/><path d="M19 14v-2h-2v2h1zm6-4h2V8h-4v2h1z"/><path d="M29 8h8V6H27v2h1zm16 6h2v-2h-2v1z"/><path d="M48 14h-1v39h-2v2h4V14zm-11-4h4V8h-4v1z"/><path d="M41 12h4v-2h-4v1zM17 53V14h-2v41h4v-2h-1z"/><path d="M24 51h-5v2h5v-1z"/><path d="M27 53h-3v2h5v-2h-1zm18-2h-5v2h5v-1z"/><path d="M35 51h-6v2h6v-1z"/><path d="M38 53h-3v2h5v-2h-1z"/></g><g fill="#edd3fd"><path d="M18 43v6h2v-1h2v1h2v2h-5v2h-2V14h2v1h-1v26z"/><path d="M27 51h-3v2h5v-2h-1zm11 0h-3v2h5v-2h-1z"/><path d="M35 49h-2v-1h-2v1h-2v2h6v-1zM25 11h2v-1h-4v1h1zm-4 2h2v-1h-4v1h1zm24 31v5h-1v-1h-2v1h-2v2h5v2h2V14h-2v29z"/><path d="M37 8H27v1h5v1h5V9zm8 4h-4v2h4v-1z"/><path d="M41 10h-4v2h4v-1z"/></g><path d="M44 14h-3v-2h-4v-2h-5V9h-5v2h-4v2h-4v2h-1v34h2v-1h2v1h2v2h5v-2h2v-1h2v1h2v2h5v-2h2v-1h2v1h1V14z" fill="#fff"/>',
    // eyes
    '<g fill="#64438e"><path d="M23 28v2h4v-2h2v-4h-2v-2h-4v2h-2v4h1zm12-4v4h2v2h4v-2h2v-4h-2v-2h-4v2h-1z"/></g>',
    // mouth
    '<g fill="#64438e"><path d="M29 32h-2v2h2v-1z"/><path d="M33 34h-4v2h6v-2h-1z"/><path d="M36 32h-1v2h2v-2z"/></g>'
  ]
  const sizes = svgs.map(value => value.length)
  svgs = svgs.join('')
  await svgStorage.createSVGContract(svgs, sizes)
  console.log('Uploaded SVG')

  // ----------------------------------------------------------------
  // Mint Aavegotchi with SVG Layers

  const AavegotchiNFT = await ethers.getContractFactory('AavegotchiNFT')
  const aavegotchiNFT = AavegotchiNFT.attach(aavegotchiDiamond.address)
  let svgLayers = [1, 2, 3, 4]
  svgLayers = svgLayers.map(value => {
    value = ethers.utils.hexlify(value)
    value = value.slice(2)
    if (value.length === 2) {
      value = '00' + value
    }
    return value
  })
  svgLayers = '0x' + svgLayers.join('').padEnd(64, '0')
  await aavegotchiNFT.mintAavegotchi(svgLayers)
  console.log('Mint Aavegotchi with SVG Layers')

  // ----------------------------------------------------------------
  // Get the combined SVG of an Aavegotchi.

  const svg = await aavegotchiNFT.getAavegotchi(0)
  console.log('Get the combined SVG of an Aavegotchi.')
  console.log()
  console.log(svg)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
