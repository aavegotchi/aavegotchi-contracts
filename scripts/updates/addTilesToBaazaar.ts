import { ethers, network } from "hardhat";
import { gasPrice } from "../helperFunctions";
import { LedgerSigner } from "@anders-t/ethers-ledger";

/* TODO: replace follwowing values */
const tileDiamond = "0x9216c31d8146bCB3eA5a9162Dc1702e8AEDCa355";
const tileIds = [28, 29, 30, 31]; //le cyan grass
const category = 5;
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
    signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");
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
  // adding tile type categories
  for (let i = 0; i < tileIds.length; i++) {
    categories.push({
      erc1155TokenAddress: tileDiamond,
      erc1155TypeId: tileIds[i],
      category: category,
    });
  }
  console.log("categories:", categories);

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
  } else {
    try {
      tx = await erc1155MarketplaceFacet.setERC1155Categories(categories, {
        gasPrice: gasPrice,
      });
      await tx.wait();
      console.log("tx:", tx);
    } catch (error) {
      console.log("error:", error);
    }
  }

  console.log("Checking tile diamond categories...");
  for (let i = 0; i < tileIds.length; i++) {
    const categorySaved = await erc1155MarketplaceFacet.getERC1155Category(
      tileDiamond,
      tileIds[i]
    );

    console.log(
      categorySaved.toNumber() === category
        ? `correct: ${tileIds[i]}`
        : `incorrect: ${i}`
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
