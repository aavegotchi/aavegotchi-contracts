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

function addCommas (nStr) {
  nStr += ''
  const x = nStr.split('.')
  let x1 = x[0]
  const x2 = x.length > 1 ? '.' + x[1] : ''
  var rgx = /(\d+)(\d{3})/
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2')
  }
  return x1 + x2
}

function strDisplay (str) {
  return addCommas(str.toString())
}

async function deployFacets(...facets) {
  const instances = [];
  for (let facet of facets) {
    let constructorArgs = [];
    if (Array.isArray(facet)) {
      ;[facet, constructorArgs] = facet;
    }
    const factory = await ethers.getContractFactory(facet);
    const facetInstance = await factory.deploy(...constructorArgs);
    await facetInstance.deployed();
    const tx = facetInstance.deployTransaction;
    const receipt = await tx.wait();
    console.log(`${facet} deploy gas used:` + strDisplay(receipt.gasUsed));
    instances.push(facetInstance);
  }
  return instances;
}

async function main() {
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let signer;
  const testing = ["hardhat", "localhost"].includes(hre.network.name);
  if (testing) {
    const owner = await (await ethers.getContractAt('OwnershipFacet', diamondAddress)).owner()
    await hre.network.provider.request({
      method: "hardhat_reset",
      params: [{
        forking: {
          jsonRpcUrl: process.env.MATIC_URL
        }
      }]
    });

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner]
    });
    signer = await ethers.provider.getSigner(owner);
  } else if (hre.network.name === "matic") {
    signer = new LedgerSigner(ethers.provider,"hid","m/44'/60'/2'/0/0")
  } else {
    throw Error("Incorrect network selected");
  }

  let [aavegotchiGameFacet, itemsFacet] = await deployFacets(
    "AavegotchiGameFacet",
    "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet"
  );

  const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 };
  let cut = [{
    facetAddress: aavegotchiGameFacet.address,
    action: FacetCutAction.Replace,
    functionSelectors: getSelectors(aavegotchiGameFacet)
  },{
    facetAddress: itemsFacet.address,
    action: FacetCutAction.Replace,
    functionSelectors: getSelectors(itemsFacet)
  }];

  console.log(cut);

  const diamondCut = await (await ethers.getContractAt("IDiamondCut", diamondAddress)).connect(signer);

  const tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, "0x", { gasLimit: 20000000 });
  console.log("Diamond cut tx:", tx.hash);
  const receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`);
  }

  console.log("Completed diamond cut: ", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
