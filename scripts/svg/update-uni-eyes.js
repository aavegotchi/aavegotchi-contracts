/* global ethers */

async function main () {
  // kovan
  const diamondAddress = '0xd0576c4371bBb9e531700898760B0064237832Ee'
  const svgFacet = await ethers.getContractAt('SvgFacet', diamondAddress)
  const svg = '<g class="gotchi-eyeColor"><path d="M35,20h1v1h-1V20z" fill="#fff"/><path d="M37 22v-1h-1v2h2v-1zm0" fill="#ffdeec"/><path d="M37 24h1v1h-1z" /><g fill="#ff3085"><path d="M36 20v-1h-1v-1h-1v3h1v-1z"/><path d="M36 20h1v1h-1z"/><path d="M37 21h1v1h-1z"/><path d="M40 24v-1h-1v-1h-1v1h-2v3h1v2h3v-1h1v-3h-1zm-3 0h1v1h-1v-1z"/><path d="M35 21h1v2h-1z"/></g><path d="M22,20h1v1h-1V20z" fill="#fff"/><path d="M24 22v-1h-1v2h2v-1zm0" fill="#ffdeec"/><path d="M24 24h1v1h-1z" /><g fill="#ff3085"><path d="M23 20v-1h-1v-1h-1v3h1v-1z"/><path d="M23 20h1v1h-1z"/><path d="M24 21h1v1h-1z"/><path d="M27 24v-1h-1v-1h-1v1h-2v3h1v2h3v-1h1v-3h-1zm-3 0h1v1h-1v-1z"/><path d="M22 21h1v2h-1z"/></g></g>'
  const _typesAndIdsAndSizes = [{ svgType: ethers.utils.formatBytes32String('eyeShapes'), ids: [22], sizes: [svg.length] }]
  const tx = await svgFacet.updateSvg(svg, _typesAndIdsAndSizes)
  const receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error with transaction: ${tx.hash}`)
  }
  console.log('Transaction succcess:', tx.hash)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
