import { ethers, network } from "hardhat";
import { gasPrice, maticTileDiamondAddress } from "../helperFunctions";
import { LedgerSigner } from "@anders-t/ethers-ledger";
import { ERC1155_BAAZAAR_CATEGORY_TO_ID } from "../../helpers/constants";

//all remaining tiles
const tileIds = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
  23, 24, 25, 26, 27, 32, 33, 34, 35, 36, 37,
];
const category = ERC1155_BAAZAAR_CATEGORY_TO_ID.TILE;

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
      erc1155TokenAddress: maticTileDiamondAddress,
      erc1155TypeId: tileIds[i],
      category: category,
    });
  }
  console.log("categories:", categories);

  if (testing) {
    tx = await erc1155MarketplaceFacet.setERC1155Categories(categories);
    console.log("Adding categories for remaining tiles tx:", tx.hash);
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
      maticTileDiamondAddress,
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
