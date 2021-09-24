const { NonceManager } = require("@ethersproject/experimental");

async function batchMintPortals() {
  const accounts = await ethers.getSigners();
  const account = await accounts[0].getAddress();

  console.log("account:", account);

  let nonceManagedSigner;
  const itemManager = "0x8D46fd7160940d89dA026D59B2e819208E714E82";

  const gasPrice = 50000000000;

  let testing = ["hardhat"].includes(hre.network.name);

  if (testing) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManager],
    });
    signer = await ethers.provider.getSigner(itemManager);
    nonceManagedSigner = new NonceManager(signer);
  } else if (hre.network.name === "matic") {
    signer = accounts[0]; // new ethers.Wallet(process.env.ITEM_MANAGER);
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

  let numberPerMint = 50;
  const maxNumber = 50; //15000;
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
