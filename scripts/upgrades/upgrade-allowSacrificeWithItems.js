
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
  console.log('diamond address:',diamondAddress)

  let signer;
  let facet;
  let owner = await (await ethers.getContractAt('OwnershipFacet', diamondAddress)).owner();

  const testing = ['hardhat', 'localhost'].includes(hre.network.name);

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

  const Facet = await ethers.getContractFactory('CollateralFacet');
 
  facet = await Facet.deploy();

  await facet.deployed();
  console.log('Deployed facet:', facet.address);

   let existingFuncs = getSelectors(facet);
 
  const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 }

  const cut = [
     {
       facetAddress: facet.address,
       action: FacetCutAction.Replace,
       functionSelectors: existingFuncs
     },      
   ];
  console.log(cut);

  const diamondCut = (await ethers.getContractAt('IDiamondCut', diamondAddress)).connect(signer);
  let tx;
  let receipt;

  if(testing) {
    console.log('Diamond cut');
    tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, '0x', { gasLimit: 8000000 });
    console.log('Diamond cut tx:', tx.hash)
    receipt = await tx.wait();
    if (!receipt.status) {
       throw Error(`Diamond upgrade failed: ${tx.hash}`)
     }
    console.log('Completed diamond cut: ', tx.hash);

  } else {
     console.log('Diamond cut');
     tx = await diamondCut.populateTransaction.diamondCut(cut, ethers.constants.AddressZero, '0x', { gasLimit: 800000 });
     await sendToMultisig(process.env.DIAMOND_UPGRADER, signer, tx);
  }
}

if(require.main === module){
  main()
    .then(() => process.exit(0))
      .catch(error => {
        console.error(error)
        process.exit(1)
    });
  }

    exports.allowSacrificeWithItems = main;
