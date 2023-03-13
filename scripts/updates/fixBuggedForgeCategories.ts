import { ethers, network } from "hardhat";
import { gasPrice } from "../helperFunctions";

const itemIds = [
  350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364,
  365, 366,
]; //le cyan grass
const wearableCategory = 0;

const finalArray = [[wearableCategory, itemIds]];

export async function fixBuggedBaazaarCategories() {
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
    signer = (await ethers.getSigners())[0];
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

  const categories: any[] = [];

  finalArray.forEach((el) => {
    const category = el[0];
    const toAdd = el[1] as number[];

    console.log("to add:", toAdd);

    for (let index = 0; index < toAdd.length; index++) {
      categories.push({
        erc1155TokenAddress: diamondAddress,
        erc1155TypeId: toAdd[index],
        category: category,
      });
    }
  });

  console.log("categories:", categories);

  // adding tile type categories

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

  console.log("Checking categories...");
  for (let i = 0; i < finalArray.length; i++) {
    const element = finalArray[i];

    const toAdd = element[1] as number[];
    const category = element[0];

    for (let i = 0; i < toAdd.length; i++) {
      const categorySaved = await erc1155MarketplaceFacet.getERC1155Category(
        diamondAddress,
        toAdd[i]
      );

      console.log(
        categorySaved.toNumber() === category
          ? `correct: ${toAdd[i]}`
          : `incorrect: ${i}`
      );
    }
  }
}

if (require.main === module) {
  fixBuggedBaazaarCategories()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
