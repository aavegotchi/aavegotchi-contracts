export function getSelectors(contract) {
  const signatures = Object.keys(contract.interface.functions);
  const selectors = signatures.reduce((acc, val) => {
    if (val !== "init(bytes)") {
      acc.push(contract.interface.getSighash(val));
    }
    return acc;
  }, []);
  return selectors;
}

export function getSelector(func) {
  const abiInterface = new ethers.utils.Interface([func]);
  return abiInterface.getSighash(ethers.utils.Fragment.from(func));
}

export const maticDiamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";

export async function contractOwner() {
  return await (
    await ethers.getContractAt("OwnershipFacet", maticDiamondAddress)
  ).owner();
}

export async function getFunctionsForFacet(facetAddress) {
  const Loupe = await ethers.getContractAt(
    "DiamondLoupeFacet",
    maticDiamondAddress
  );
  const functions = await Loupe.facetFunctionSelectors(facetAddress);
  return functions;
}
