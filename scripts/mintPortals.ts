async function mintPortals() {
  const diamondAddress = "0x83e73D9CF22dFc3A767EA1cE0611F7f50306622e";
  const toAddress = "0xb7601193f559de56D67FB8e6a2AF219b05BD36c7";
  let numberPerMint = 50;

  const accounts = await ethers.getSigners();
  const signer = accounts[0];

  let shopFacet;

  shopFacet = await ethers.getContractAt("ShopFacet", diamondAddress, signer);

  let receipt = await shopFacet.mintPortals(toAddress, numberPerMint);
  console.log("tx hash:", receipt.hash);
}

mintPortals()
  .then(() => process.exit(1))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.deploy = mintPortals;
