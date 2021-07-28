const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";

async function main() {
  this.timeout = 200000000;
  let itemsFacet = await ethers.getContractAt(
    "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
    diamondAddress
  );
  let svgFacet = await ethers.getContractAt("SvgFacet", diamondAddress);

  signer = await ethers.provider.getSigner(
    "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c"
  );
  const aavegotchiOwnerSigner = await itemsFacet.connect(signer);

  await aavegotchiOwnerSigner.equipWearables(
    "2575",
    [0, 0, 0, 0, 0, 0, 206, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  );

  const svgOutput = await svgFacet.getAavegotchiSvg("2575");

  console.log("svg output:", svgOutput);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
