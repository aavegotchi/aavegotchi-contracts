
/* global ethers hre */
/* eslint prefer-const: "off" */

const { LedgerSigner } = require('@ethersproject/hardware-wallets')
const { sendToMultisig } = require('../libraries/multisig/multisig.js')

const getSelectors = (contract) => {
  const signatures = Object.keys(contract.interface.functions)
  const selectors = signatures.reduce((acc, val) => {
    if (val !== 'init(bytes)') {
      acc.push(contract.interface.getSighash(val))
    }
    return acc
  }, [])
  return selectors
}

const getSelector = (func) => {
  const abiInterface = new ethers.utils.Interface([func])
  return abiInterface.getSighash(ethers.utils.Fragment.from(func))
}


async function main () {
  const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d';

  let signer;
  let facet;
  let owner = await (await ethers.getContractAt('OwnershipFacet', diamondAddress)).owner();

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

  const Facet = await ethers.getContractFactory('contracts/Aavegotchi/facets/CollateralFacet.sol:CollateralFacet');
  facet = await Facet.deploy();
  await facet.deployed();
  console.log('Deployed facet:', facet.address);

  const newFuncs = [
    getSelector('function depositERC20(uint256 _tokenId,  address _erc20Contract, uint256 _value) external'),
    getSelector('function escrowBalance(uint256 _tokenId, address _erc20Contract) external view returns(uint256)'),
    getSelector('function transferEscrow(uint256 _tokenId, address _recipient, uint256 _transferAmount) external')
  ]

  // let existingFuncs = getSelectors(facet);
  // for (const selector of newFuncs) {
  //   if (!existingFuncs.includes(selector)) {
  //     throw Error(`Selector ${selector} not found`);
  //   }
  // }

  // existingFuncs = existingFuncs.filter(selector => !newFuncs.includes(selector));

  const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 }

  const cut = [
     {
       facetAddress: facet.address,
       action: FacetCutAction.Add,
       functionSelectors: newFuncs
     },
     // {
     //   facetAddress: facet.address,
     //   action: FacetCutAction.Replace,
     //   functionSelectors: existingFuncs
     // }
   ];
  console.log(cut);

  const diamondCut = (await ethers.getContractAt('IDiamondCut', diamondAddress)).connect(signer);
  let tx;
  let receipt;

  console.log('Diamond cut');
  tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, '0x', { gasLimit: 8000000 });
  console.log('Diamond cut tx:', tx.hash)
  receipt = await tx.wait();
  if (!receipt.status) {
     throw Error(`Diamond upgrade failed: ${tx.hash}`)
   }
  console.log('Completed diamond cut: ', tx.hash)
  }

  main()
    .then(() => process.exit(0))
      .catch(error => {
        console.error(error)
        process.exit(1)
    })
