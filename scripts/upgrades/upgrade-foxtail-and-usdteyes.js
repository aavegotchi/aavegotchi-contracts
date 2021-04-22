
/* global ethers hre */
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
  const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  let signer
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

  //const ItemsFacet = await ethers.getContractFactory('contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet')
  
  const CollateralFacet = await ethers.getContractFactory('CollateralFacet')
  let collateralFacet = await CollateralFacet.deploy()
  await collateralFacet.deployed()
  console.log('Deployed facet:', collateralFacet.address)

  const newCollateralFuncs = [
    getSelector('function setCollateralEyeShapeSvgId(address _collateralToken, uint8 _svgId) external')
  ]
  const existingCollateralFuncs = getSelectors(collateralFacet).filter(selector => !newCollateralFuncs.includes(selector))

  const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 }

  const cut = [
    {
      facetAddress: collateralFacet.address,
      action: FacetCutAction.Add,
      functionSelectors: newCollateralFuncs
    },
    {
      facetAddress: collateralFacet.address,
      action: FacetCutAction.Replace,
      functionSelectors: existingCollateralFuncs
    },
    {
      facetAddress: itemsFacet.address,
      action: FacetCutAction.Add,
      functionSelectors: newItemsFuncs
    },
    {
      facetAddress: itemsFacet.address,
      action: FacetCutAction.Replace,
      functionSelectors: existingItemsFuncs
    }
  ]
  console.log(cut)

  const diamondCut = (await ethers.getContractAt('IDiamondCut', diamondAddress)).connect(signer)
  let tx
  let receipt
  let svgFacet
  let svg

  console.log('Diamond cut')
  tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, '0x', { gasLimit: 8000000 })
  console.log('Diamond cut tx:', tx.hash)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  console.log('Completed diamond cut: ', tx.hash)

  itemsFacet = (await ethers.getContractAt('contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet', diamondAddress)).connect(signer)
  svgFacet = (await ethers.getContractAt('SvgFacet', diamondAddress)).connect(signer)
  collateralFacet = (await ethers.getContractAt('CollateralFacet', diamondAddress)).connect(signer)

  // usdt eyeshape
  console.log('Setting ustd eyeshape')
  svg = '<g class="gotchi-eyeColor gotchi-primary"><path d="M38 27h2v3h-2zm0-2v1h2v-1h3v-1h-3v-1h2v-2h-6v2h2v1h-3v1z"/><path d="M34 25h1v1h-1z"/><path d="M35 26h3v1h-3zm8-1h1v1h-1z"/><path d="M40 26h3v1h-3zm-16 1h2v3h-2zm0-2v1h2v-1h3v-1h-3v-1h2v-2h-6v2h2v1h-3v1z"/><path d="M20 25h1v1h-1z"/><path d="M21 26h3v1h-3zm8-1h1v1h-1z"/><path d="M26 26h3v1h-3z"/></g>'
  tx = await svgFacet.storeSvg(svg, [{ svgType: ethers.utils.formatBytes32String('eyeShapes'), sizes: [svg.length] }], { gasLimit: 5000000 })
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error with transaction: ${tx.hash}`)
  }
  console.log('Transaction succcess:', tx.hash)

  console.log('Setting ustd eyeshape id')
  tx = await collateralFacet.setCollateralEyeShapeSvgId('0xDAE5F1590db13E3B40423B5b5c5fbf175515910b', 25)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error with transaction: ${tx.hash}`)
  }
  console.log('Transaction succcess:', tx.hash)

  // setting fox tail wearable
  let foxTailSvg = '<path d="M14 2V1h-1V0H9v1H8v1H7v1H3V2H1V1H0v11h1v1h2v1h4v-1h2v-1h1v-1h1V9h1V7h1v1h1V7h1V2z" fill="#6c3617"/><path d="M13 2V1H9v1H8v1H7v1H3V3H1V2H0v9h1v1h2v1h4v-1h2v-1h1V9h1V7h1V6h1v1h1V2z" fill="#c65616"/><path d="M13 2V1H9v1H8v1H7v1H3V3H1V2H0v8h1v1h2v1h4v-1h2V9h1V7h1V6h1V5h1v2h1V2z" fill="#f57a1a"/><g fill="#fff"><path d="M13 2V1H9v1H8v1H7v1H3V3H1v2h1v1h2v1h2v1h2V7h1V6h1V5h3v2h1V2z"/><path d="M0 2h1v1H0z"/></g>'
  let robe = '<g><g class="gotchi-sleeves gotchi-sleeves-left gotchi-sleeves-up"><path d="M42,0v1h-3v18h1v-5h1V8h1V7h2V0H42z"/><path d="M42,0h1v7h-1V0z" fill="#f0f"/><path d="M43,0h1v7h-1V0z" fill="#0ff"/></g><g class="gotchi-sleeves gotchi-sleeves-left gotchi-sleeves-down"><path d="M42 4V3h-1V2h-1V1h-1v18h1v-4h1v-5h1v1h2V4z"/><path d="M43 11h-1V4h1v7z" fill="#f0f"/><path d="M44 11h-1V4h1v7z" fill="#0ff"/></g><g class="gotchi-sleeves gotchi-sleeves-right gotchi-sleeves-up"><path d="M2,1V0H0v7h2v1h1v6h1v5h1V1H2z"/><path d="M2,7H1V0h1V7z" fill="#f0f"/><path d="M1,7H0V0h1V7z" fill="#0ff"/></g></g>'
  let aagentShirt = '<g><g class="gotchi-sleeves gotchi-sleeves-left gotchi-sleeves-up"><path d="M38 0v1h-1v8h1V8h1V7h1V0z" fill="#8c007d"/><path d="M38,7v1h-1V2h1V1h1v6H38z" fill="#f0f"/></g><g class="gotchi-sleeves gotchi-sleeves-left gotchi-sleeves-down"><path d="M39 3V2h-1V1h-1v8h1v1h2V3z" fill="#8c007d"/><path d="M38,3V2h-1v6h1v1h1V3H38z" fill="#f0f"/></g><g class="gotchi-sleeves gotchi-sleeves-right gotchi-sleeves-up"><path d="M2 1V0H0v7h1v1h1v1h1V1z" fill="#8c007d"/><path d="M2,7v1h1V2H2V1H1v6H2z" fill="#f0f"/></g><g class="gotchi-sleeves gotchi-sleeves-right gotchi-sleeves-down"><path d="M2 1v1H1v1H0v7h2V9h1V1z" fill="#8c007d"/><path d="M2,3V2h1v6H2v1H1V3H2z" fill="#f0f"/></g></g>'
  console.log('Updating SVGs')
  tx = await svgFacet.updateSvg(foxTailSvg + robe + aagentShirt, [
    { svgType: ethers.utils.formatBytes32String('wearables'), ids: [40], sizes: [foxTailSvg.length] },
    { svgType: ethers.utils.formatBytes32String('sleeves'), ids: [11], sizes: [robe.length] },
    { svgType: ethers.utils.formatBytes32String('sleeves'), ids: [13], sizes: [aagentShirt.length] }
  ], { gasLimit: 5000000 })
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error with transaction: ${tx.hash}`)
  }
  console.log('Transaction succcess:', tx.hash)

  console.log('Set Foxtail to Pet position')
  tx = await itemsFacet.setWearableSlotPositions(40, [false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false], { gasLimit: 5000000 })
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error with transaction: ${tx.hash}`)
  }
  console.log('Transaction succcess:', tx.hash)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
