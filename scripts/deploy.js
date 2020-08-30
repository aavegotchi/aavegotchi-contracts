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
  const AavegotchiDiamond = await ethers.getContractFactory('Aavegotchi')
  // const aavegotchiDiamond = AavegotchiDiamond.attach('0xFCB5348111665Cf95a777f0c4FCA768E05601760')
  const aavegotchiDiamond = await AavegotchiDiamond.deploy()
  await aavegotchiDiamond.deployed()

  const SVGStorage = await ethers.getContractFactory('SVGStorage')
  const svgStorage = SVGStorage.attach(aavegotchiDiamond.address)

  const AavegotchiNFT = await ethers.getContractFactory('AavegotchiNFT')
  const aavegotchiNFT = AavegotchiNFT.attach(aavegotchiDiamond.address)

  const Wearables = await ethers.getContractFactory('Wearables')
  const wearables = Wearables.attach(aavegotchiDiamond.address)

  const accounts = await ethers.getSigners()
  const address = await accounts[0].getAddress()

  console.log('Deployed Aavegotchi contract:')
  console.log(aavegotchiDiamond.address)
  // kovan: 0x201Df88D8d79ACA0AA6360F02eb9dD8aefdB1dfb
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
  let sizes = svgs.map(value => value.length)
  svgs = svgs.join('')
  await svgStorage.storeAavegotchiLayersSVG(svgs, sizes)
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
  await svgStorage.storeWearablesSVG(svgs, sizes)
  console.log('Uploaded Wearables SVG')

  // ----------------------------------------------------------------
  // Mint Aavegotchi with SVG Layers

  let svgLayers = [0, 1, 2, 3]
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
  // Mint Wearables
  await wearables.mintWearables()
  console.log('Minted one set of wearables')

  // ----------------------------------------------------------------
  // Add Wearables
  // transferToParent(address _from, address _toContract, uint _toTokenId, uint _id, uint _value)
  function wearableId (id) {
    return ethers.BigNumber.from(id).mul(ethers.BigNumber.from(2).pow(240))
  }
  // const id1 = wearableId(1)
  // const id2 = wearableId(2)
  // const id3 = wearableId(3)
  // await wearables.transferToParent(address, aavegotchiDiamond.address, 0, id1, 1)
  // await wearables.transferToParent(address, aavegotchiDiamond.address, 0, id2, 1)
  // await wearables.transferToParent(address, aavegotchiDiamond.address, 0, id3, 1)
  // console.log('Added wearables')

  // ----------------------------------------------------------------
  // Send some ether

  const tx = accounts[0].sendTransaction({
    to: '0x0b22380B7c423470979AC3eD7d3c07696773dEa1',
    value: ethers.utils.parseEther('10.0')
  })

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
