
/* global ethers */
/* eslint prefer-const: "off" */

const { LedgerSigner } = require('@ethersproject/hardware-wallets')

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
  const signer = new LedgerSigner(ethers.provider)
  const diamondAddress = '0xd0576c4371bBb9e531700898760B0064237832Ee'

  const SvgFacet = await ethers.getContractFactory('SvgFacet')
  let svgFacet = await SvgFacet.deploy()
  await svgFacet.deployed()
  console.log('Deployed facet:', svgFacet.address)

  const newFuncs = [
    // getSelector('function updateSvg(string calldata _svg, tuple(bytes32 svgType, uint256[] ids, uint256[] sizes)[] calldata _typesAndIdsAndSizes) external'),
    // getSelector('function setSleeves(tuple(uint256 sleeveId, uint256 wearableId)[] calldata _sleeves) external'),
    // getSelector('function setItemsDimensions(uint256[] calldata _itemIds, tuple(uint8 x, uint8 y, uint8 width, uint8 height)[] calldata _dimensions) external')
    // getSelector('function getSvg(bytes32 _svgType, uint256 _itemId) external view returns (string memory svg_)')
    // getSelector('function getSvgs(bytes32 _svgType, uint256[] calldata _itemIds) external view returns (string[] memory svgs_)')
  ]
  const existingSvgFacetFuncs = getSelectors(svgFacet).filter(selector => !newFuncs.includes(selector))

  const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 }

  const cut = [
    // {
    //   facetAddress: svgFacet.address,
    //   action: FacetCutAction.Add,
    //   functionSelectors: newFuncs
    // },
    {
      facetAddress: svgFacet.address,
      action: FacetCutAction.Replace,
      functionSelectors: existingSvgFacetFuncs
    }
  ]
  console.log(cut)

  // const diamondCut = (await ethers.getContractAt('IDiamondCut', diamondAddress)).connect(signer)
  const diamondCut = await ethers.getContractAt('IDiamondCut', diamondAddress)
  let tx
  let result

  // let tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, '0x', { gasLimit: 8000000 })
  // console.log('Diamond cut tx:', tx.hash)
  // let receipt = await tx.wait()
  // if (!receipt.status) {
  //   throw Error(`Diamond upgrade failed: ${tx.hash}`)
  // }
  // console.log('Completed diamond cut: ', tx.hash)

  // svgFacet = (await ethers.getContractAt('SvgFacet', diamondAddress)).connect(signer)
  svgFacet = await ethers.getContractAt('SvgFacet', diamondAddress)
  // fixing uni eyes
  const svg = '<g class="gotchi-eyeColor"><path d="M35,20h1v1h-1V20z" fill="#fff"/><path d="M37 22v-1h-1v2h2v-1zm0" fill="#ffdeec"/><path d="M37 24h1v1h-1z" /><g fill="#ff3085"><path d="M36 20v-1h-1v-1h-1v3h1v-1z"/><path d="M36 20h1v1h-1z"/><path d="M37 21h1v1h-1z"/><path d="M40 24v-1h-1v-1h-1v1h-2v3h1v2h3v-1h1v-3h-1zm-3 0h1v1h-1v-1z"/><path d="M35 21h1v2h-1z"/></g><path d="M22,20h1v1h-1V20z" fill="#fff"/><path d="M24 22v-1h-1v2h2v-1zm0" fill="#ffdeec"/><path d="M24 24h1v1h-1z" /><g fill="#ff3085"><path d="M23 20v-1h-1v-1h-1v3h1v-1z"/><path d="M23 20h1v1h-1z"/><path d="M24 21h1v1h-1z"/><path d="M27 24v-1h-1v-1h-1v1h-2v3h1v2h3v-1h1v-3h-1zm-3 0h1v1h-1v-1z"/><path d="M22 21h1v2h-1z"/></g></g>'
  const _typesAndIdsAndSizes = [{ svgType: ethers.utils.formatBytes32String('eyeShapes'), ids: [23], sizes: [svg.length] }]
  tx = await svgFacet.updateSvg(svg, _typesAndIdsAndSizes, { gasLimit: 5000000 })
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error with transaction: ${tx.hash}`)
  }
  console.log('Transaction succcess:', tx.hash)

  // const itemIds = [
  //   114, // Red Hawaiian Shirt
  //   115, // Blue Hawaiian Shirt
  //   109, // Rasta Shirt
  //   50, // gldnxross
  //   37, // ETH Tshirt
  //   91, // Pajama Shirt
  //   28, // Marc Outfit
  //   22 // Captain Aave Suit
  // ]
  // const dimensions = [
  //   { x: 12, y: 32, width: 40, height: 18 }, // Red Hawaiian Shirt
  //   { x: 12, y: 32, width: 40, height: 18 }, // Blue Hawaiian Shirt
  //   { x: 12, y: 32, width: 40, height: 19 }, // Rasta Shirt
  //   { x: 10, y: 31, width: 44, height: 24 }, // gldnxross
  //   { x: 12, y: 32, width: 40, height: 19 }, // ETH Tshirt
  //   { x: 11, y: 31, width: 42, height: 22 }, // Pajama Shirt
  //   { x: 12, y: 32, width: 40, height: 22 }, // Marc Outfit
  //   { x: 7, y: 31, width: 50, height: 22 } // Captain Aave Suit
  // ]

  // tx = await svgFacet.setItemsDimensions(itemIds, dimensions)
  // console.log('Setting SVG dimensions')
  // receipt = await tx.wait()
  // if (!receipt.status) {
  //   throw Error(`Error with transaction: ${tx.hash}`)
  // }
  // console.log('Transaction succcess:', tx.hash)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
