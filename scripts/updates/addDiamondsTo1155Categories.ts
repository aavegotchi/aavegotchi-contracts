import { ethers, network } from "hardhat";
import { gasPrice } from "../helperFunctions";
import { sendToMultisig } from "../libraries/multisig/multisig";
const { LedgerSigner } = require("@ethersproject/hardware-wallets");

/* TODO: replace follwowing values */
const installationDiamond = "0x19f870bD94A34b3adAa9CaA439d333DA18d6812A";
const installationTypes = [1]; //golden aaltar lvl1

const tileDiamond = "0x9216c31d8146bCB3eA5a9162Dc1702e8AEDCa355";
const tileTypes = [1, 2, 3];
/* TODO: end */

async function main() {
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let signer;

  const testing = ["hardhat", "localhost"].includes(network.name);
  if (testing) {
    const itemManager = "0x8D46fd7160940d89dA026D59B2e819208E714E82";
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManager],
    });
    signer = await ethers.provider.getSigner(itemManager);
  } else if (network.name === "matic") {
    signer = new LedgerSigner(ethers.provider, "hid", "m/44'/60'/2'/0/0");
    console.log("signer:", signer);
  } else {
    throw Error("Incorrect network selected");
  }

  let erc1155MarketplaceFacet = await ethers.getContractAt(
    "ERC1155MarketplaceFacet",
    diamondAddress,
    signer
  );
  let tx;
  let receipt;

  const categories = [];
  // adding installation type categories
  // for (let i = 0; i < installationTypes.length; i++) {
  //   categories.push({
  //     erc1155TokenAddress: installationDiamond,
  //     erc1155TypeId: installationTypes[i],
  //     category: 4,
  //   });
  // }
  // adding tile type categories
  for (let i = 0; i < tileTypes.length; i++) {
    categories.push({
      erc1155TokenAddress: tileDiamond,
      erc1155TypeId: tileTypes[i],
      category: 5,
    });
  }

  if (testing) {
    tx = await erc1155MarketplaceFacet.setERC1155Categories(categories);
    console.log(
      "Adding categories for both installation and tile diamond tx:",
      tx.hash
    );
    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Adding categories failed: ${tx.hash}`);
    }
    console.log("Adding categories succeeded:", tx.hash);

    console.log("Checking installation diamond categories...");
    for (let i = 0; i < installationTypes.length; i++) {
      const category = await erc1155MarketplaceFacet.getERC1155Category(
        installationDiamond,
        installationTypes[i]
      );
      console.log(category.eq(4) ? "correct" : "incorrect");
    }
    console.log("Checking installation diamond categories...");
    // for (let i = 0; i < tileTypes.length; i++) {
    //   const category = await erc1155MarketplaceFacet.getERC1155Category(
    //     tileDiamond,
    //     tileTypes[i]
    //   );
    //   console.log(category.eq(5) ? "correct" : "incorrect");
    // }
  } else {
    try {
      tx =
        await erc1155MarketplaceFacet.populateTransaction.setERC1155Categories(
          categories,
          { gasPrice: gasPrice }
        );
      console.log("tx:", tx);
      //@ts-ignore
      await sendToMultisig(process.env.DIAMOND_UPGRADER, signer, tx, ethers);
    } catch (error) {
      console.log("error:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
