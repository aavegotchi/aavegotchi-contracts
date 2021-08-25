const { NonceManager } = require("@ethersproject/experimental");

async function batchMintPortals() {
  const accounts = await ethers.getSigners();
  const account = await accounts[0].getAddress();
  let nonceManagedSigner;
  const itemManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";

  const gasPrice = 20000000000;

  let testing = ["hardhat"].includes(hre.network.name);

  if (testing) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManager],
    });
    signer = await ethers.provider.getSigner(itemManager);
    nonceManagedSigner = new NonceManager(signer);
  } else if (hre.network.name === "matic") {
    signer = new LedgerSigner(ethers.provider, "hid", "m/44'/60'/2'/0/0");
  } else {
    throw Error("Incorrect network selected");
  }

  console.log("Deploying Account: " + itemManager + "\n---");

  let totalGasUsed = ethers.BigNumber.from("0");
  let shopFacet;
  let diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";

  console.log(`Batch minting Portals to Item Manager: ${itemManager}`);

  shopFacet = await ethers.getContractAt(
    "ShopFacet",
    diamondAddress,
    nonceManagedSigner
  );

  let numberPerMint = 5;
  const maxNumber = 11; //15000;
  //Mint 2000 ERC721s

  const gameFacet = await ethers.getContractAt(
    "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
    diamondAddress
  );

  let remaining = maxNumber;

  let promises = [];
  let totalMinted = 0;

  while (remaining > 0) {
    //Reset numberPerMint if remaining is low
    if (remaining < numberPerMint) numberPerMint = remaining;

    console.log(`Minting ${numberPerMint} Portals of ${maxNumber}!`);
    let r = await shopFacet.mintPortals(itemManager, numberPerMint, {
      gasPrice: gasPrice,
    });
    console.log("tx hash:", r.hash);
    totalMinted += numberPerMint;
    remaining -= numberPerMint;
    totalGasUsed = totalGasUsed.add(r.gasLimit);
    promises.push(r);
    console.log("Total minted:", totalMinted);
    const balance = await gameFacet.balanceOf(itemManager);
    console.log("Balance of Item Manager:", balance.toString());
  }

  await Promise.all(promises);

  console.log("Used Gas:", totalGasUsed.toString());
}

batchMintPortals()
  .then(() => process.exit(1))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.deploy = batchMintPortals;
