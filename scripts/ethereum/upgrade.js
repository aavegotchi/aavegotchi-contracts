
/* global ethers */

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
  // gorli
  const diamondAddress = '0x6c1fc89903d13EA41a5571751aD21973dB45c9e7'
  const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 }
  // const diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)
  //   const bridgeFacetAddress = await diamondLoupeFacet.facetAddress(getSelector('function exitTokens(address, address rootToken, bytes calldata log) external'))
  //   if (bridgeFacetAddress === ethers.constants.AddressZero) {
  //     throw (Error('Could not find facet'))
  //   }

  //   const aavegotchiFacetAddress = await diamondLoupeFacet.facetAddress(getSelector('function totalSupply() external view returns (uint256 totalSupply_)'))
  //   if (aavegotchiFacetAddress === ethers.constants.AddressZero) {
  //     throw (Error('Could not find facet'))
  //   }

  const BridgeFacet = await ethers.getContractFactory('contracts/Ethereum/facets/BridgeFacet.sol:BridgeFacet')
  const bridgeFacet = await BridgeFacet.deploy()
  await bridgeFacet.deployed()

  const AavegotchiFacet = await ethers.getContractFactory('contracts/Ethereum/facets/AavegotchiFacet.sol:AavegotchiFacet')
  const aavegotchiFacet = await AavegotchiFacet.deploy()
  await aavegotchiFacet.deployed()

  const cut = [
    // {
    //   facetAddress: bridgeFacet.address,
    //   action: FacetCutAction.Replace,
    //   functionSelectors: [
    //     getSelector('function exitTokens(address,address rootToken,bytes calldata log) external')
    //   ]
    // },
    {
      facetAddress: aavegotchiFacet.address,
      action: FacetCutAction.Replace,
      functionSelectors: [
        getSelector('function tokenIdsOfOwner(address _owner) external view returns (uint256[] memory tokenIds_)')
      ]
    }
  ]

  const diamondCut = await ethers.getContractAt('IDiamondCut', diamondAddress)
  const tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, '0x', { gasLimit: 5000000 })
  console.log('Diamond cut tx:', tx.hash)
  const receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  console.log('Completed diamond cut: ', tx.hash)
}

// Deployed stkGHSTUSDC: 0x04439eC4ba8b09acfae0E9b5D75A82cC63b19f09
// Deployed new StakingFacet: 0xc87f3dC7c12F090617112D3892eC284483D8B633

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
