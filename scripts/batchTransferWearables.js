const { NonceManager } = require("@ethersproject/experimental");
const { LedgerSigner } = require("@ethersproject/hardware-wallets");

async function batchMintPortals() {
  const accounts = await ethers.getSigners();
  const account = await accounts[0].getAddress();
  let nonceManagedSigner;
  const itemManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";

  const gasPrice = 30000000000;

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

  const newItemManager = "0x8D46fd7160940d89dA026D59B2e819208E714E82";
  const ids = [245];
  const values = [
    1000, 50, 100, 5, 100, 50, 50, 500, 250, 100, 1000, 500, 500, 250, 1000,
    250, 250, 1000, 500, 1000, 500, 1000, 500, 50, 100, 250, 50, 5, 500, 500,
    250, 100, 250, 250,
  ];

  const itemsFacet = await ethers.getContractAt(
    "ItemsTransferFacet",
    diamondAddress,
    signer
  );

  await itemsFacet.safeBatchTransferFrom(
    itemManager,
    newItemManager,
    ids,
    values,
    [],
    { gasPrice: gasPrice }
  );
}

batchMintPortals()
  .then(() => process.exit(1))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.deploy = batchMintPortals;
