const { NonceManager } = require("@ethersproject/experimental");

async function batchMintPortals() {
  const accounts = await ethers.getSigners();
  const account = await accounts[0].getAddress();

  console.log("account:", account);

  let nonceManagedSigner;
  const itemManager = "0x8D46fd7160940d89dA026D59B2e819208E714E82";

  const gasPrice = 70000000000;

  let testing = ["hardhat"].includes(hre.network.name);

  if (testing) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManager],
    });
    signer = await ethers.provider.getSigner(itemManager);
    nonceManagedSigner = new NonceManager(signer);
  } else if (hre.network.name === "matic") {
    signer = accounts[0];
  } else {
    throw Error("Incorrect network selected");
  }

  console.log("Deploying Account: " + itemManager + "\n---");

  let totalGasUsed = ethers.BigNumber.from("0");
  let shopFacet;
  let diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  const transferPortalsContract = "0xa85F5a59a71842FdDaABD4C2cd373300A31750D8";

  console.log(
    `Batch transferring Portals fr Item Manager: ${itemManager} to Raffle Contract ${transferPortalsContract}`
  );

  let numberPerTransfer = 50;
  const maxNumber = 3000;

  const gameFacet = await ethers.getContractAt(
    "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
    diamondAddress,
    signer
  );

  let remaining = maxNumber;

  let totalMinted = 0;

  while (remaining > 0) {
    //Reset numberPerMint if remaining is low
    if (remaining < numberPerTransfer) numberPerTransfer = remaining;

    let tokenIds = (await gameFacet.tokenIdsOfOwner(itemManager)).slice(
      0,
      numberPerTransfer
    );
    console.log("tokenids:", tokenIds);

    console.log(`Transferring ${numberPerTransfer} Portals!`);
    let r = await gameFacet.safeBatchTransferFrom(
      itemManager,
      transferPortalsContract,
      tokenIds,
      [],
      { gasPrice: gasPrice }
    );

    await r.wait();

    console.log("tx hash:", r.hash);
    totalMinted += numberPerTransfer;
    remaining -= numberPerTransfer;
    totalGasUsed = totalGasUsed.add(r.gasLimit);

    console.log("Total transferred:", totalMinted);
    let balance = await gameFacet.balanceOf(itemManager);
    console.log("Balance of Item Manager:", balance.toString());

    balance = await gameFacet.balanceOf(transferPortalsContract);
    console.log("Balance of Transfer Portal:", balance.toString());
  }

  console.log("Used Gas:", totalGasUsed.toString());
}

batchMintPortals()
  .then(() => process.exit(1))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.deploy = batchMintPortals;
