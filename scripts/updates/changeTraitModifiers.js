/* global ethers hre */
/* eslint prefer-const: "off" */

const { LedgerSigner } = require("@ethersproject/hardware-wallets");
const { sendToMultisig } = require("../libraries/multisig/multisig");

async function main() {
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let signer;

  let itemManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";

  const testing = ["hardhat", "localhost"].includes(hre.network.name);
  if (testing) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManager],
    });
    signer = await ethers.provider.getSigner(itemManager);
  } else if (hre.network.name === "matic") {
    signer = new LedgerSigner(ethers.provider, "hid", "m/44'/60'/2'/0/0");
  } else {
    throw Error("Incorrect network selected");
  }

  const itemManagerDAO = await ethers.getContractAt(
    "DAOFacet",
    diamondAddress,
    signer
  );

  /*
  await itemManagerDAO.setItemTraitModifiersAndRarityModifier(
    "210",
    [0, 0, 0, 0, 0, 0],
    0
  );
  */

  const itemsFacet = await ethers.getContractAt(
    "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
    diamondAddress
  );

  const itemType = await itemsFacet.getItemType("210");

  console.log("item type:", itemType);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
