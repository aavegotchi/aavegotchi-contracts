
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
  let erc721Facet
  let erc1155Facet
  let owner = await (await ethers.getContractAt('OwnershipFacet', diamondAddress)).owner()
  const testing = ['hardhat', 'localhost'].includes(hre.network.name)
  if (testing) {
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [owner]
    })
    signer = await ethers.getSigner(owner)
  } else if (hre.network.name === 'matic') {
    signer = new LedgerSigner(ethers.provider)
  } else {
    throw Error('Incorrect network selected')
  }

  const ERC721Facet = await ethers.getContractFactory('ERC721MarketplaceFacet')
  erc721Facet = await ERC721Facet.deploy()
  await erc721Facet.deployed()
  console.log('Deployed ERC721 facet:', erc721Facet.address)

  const ERC1155Facet = await ethers.getContractFactory('ERC1155MarketplaceFacet')
  erc1155Facet = await ERC1155Facet.deploy()
  await erc1155Facet.deployed()
  console.log('Deployed ERC1155 facet:', erc1155Facet.address)

  const erc721MarketplaceSelectors = getSelectors(erc721Facet)
  const erc1155MarketplaceSelectors = getSelectors(erc1155Facet)


  const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 }

  const cut = [
    {
      facetAddress: erc721Facet.address,
      action: FacetCutAction.Replace,
      functionSelectors: erc721MarketplaceSelectors
    },
    {
      facetAddress: erc1155Facet.address,
      action: FacetCutAction.Replace,
      functionSelectors: erc1155MarketplaceSelectors
    }
  ]
  console.log(cut)

  const diamondCut = (await ethers.getContractAt('IDiamondCut', diamondAddress)).connect(signer)
  let tx
  let receipt

  console.log('Diamond cut')
  tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, '0x', { gasLimit: 8000000 })
  console.log('Diamond cut tx:', tx.hash)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  console.log('Completed diamond cut: ', tx.hash)


  //To do: Write test and check that the amount of fees transferred to the Player Rewards address is correct.

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  });

 exports.agip6Project = main;
