
/* global ethers hre */
/* eslint prefer-const: "off" */

const { LedgerSigner } = require('@ethersproject/hardware-wallets')

const { sendToMultisig } = require('../libraries/multisig/multisig.js')

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

  const Facet = await ethers.getContractFactory('DAOFacet')
  let facet = await Facet.deploy()
  await facet.deployed()
  console.log('Deployed facet:', facet.address)

  const newFuncs = [
    getSelector('function updateWearableSets(uint256[] calldata _setIds, tuple(string name, uint8[] allowedCollaterals, uint16[] wearableIds, int8[5] traitsBonuses)[] calldata _wearableSets) external')
  ]
  let existingFuncs = getSelectors(facet)
  for (const selector of newFuncs) {
    if (!existingFuncs.includes(selector)) {
      throw Error(`Selector ${selector} not found`)
    }
  }
  existingFuncs = existingFuncs.filter(selector => !newFuncs.includes(selector))

  const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 }

  const cut = [
    {
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: newFuncs
    },
    {
      facetAddress: facet.address,
      action: FacetCutAction.Replace,
      functionSelectors: existingFuncs
    }
  ]
  console.log(cut)
  const diamondCut = await ethers.getContractAt('IDiamondCut', diamondAddress, signer)
  let tx
  let receipt

  const setIds = [5, 6, 37, 38]
  let sets = [
    {
      name: 'Godlike Sergey',
      allowedCollaterals: [],
      wearableIds: [13, 14, 16],
      traitsBonuses: [6, -3, 0, 0, 0]
    },
    {
      name: 'Apex Sergey',
      allowedCollaterals: [3],
      wearableIds: [13, 14, 16, 17],
      traitsBonuses: [6, -4, 0, 0, 0]
    },
    {
      name: 'Sushi Chef',
      allowedCollaterals: [],
      wearableIds: [80, 81, 82],
      traitsBonuses: [4, 0, 2, 0, 0]

    },
    {
      name: 'Sushi Chef',
      allowedCollaterals: [],
      wearableIds: [80, 81, 83],
      traitsBonuses: [3, 0, 2, 0, 0]
    }
  ]

  if (testing) {
    console.log('Diamond cut')
    tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
    console.log('Diamond cut tx:', tx.hash)
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
    console.log('Completed diamond cut: ', tx.hash)

    console.log('Update sets')
    const dao = await ethers.getContractAt('DAOFacet', diamondAddress, signer)

    tx = await dao.updateWearableSets(setIds, sets, { gasLimit: 8000000 })
    console.log('Update sets tx:', tx.hash)
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Update sets failed: ${tx.hash}`)
    }
    console.log('Completed updating sets: ', tx.hash)

    let itemsFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet', diamondAddress)
    // let set = await itemsFacet.getWearableSet(69)
    // console.log(set)
    const names = [
      'Godlike Sergey',
      'Apex Sergey',
      'Sushi Chef'
    ]
    sets = await itemsFacet.getWearableSets()
    for (const [index, set] of sets.entries()) {
      if (names.includes(set.name)) {
        console.log(index, set)
      }
    }
  } else {
    // console.log('Diamond cut')
    // tx = await diamondCut.populateTransaction.diamondCut(cut, ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
    // await sendToMultisig(process.env.DIAMOND_UPGRADER, signer, tx)

    // console.log('Update sets')
    // const dao = await ethers.getContractAt('DAOFacet', diamondAddress, signer)

    // tx = await dao.populateTransaction.updateWearableSets(setIds, sets, { gasLimit: 8000000 })
    // await sendToMultisig(process.env.DIAMOND_UPGRADER, signer, tx)

    let itemsFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet', diamondAddress)
    // let set = await itemsFacet.getWearableSet(69)
    // console.log(set)
    const names = [
      'Godlike Sergey',
      'Apex Sergey',
      'Sushi Chef'
    ]
    sets = await itemsFacet.getWearableSets()
    for (const [index, set] of sets.entries()) {
      if (names.includes(set.name)) {
        console.log(index, set)
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
