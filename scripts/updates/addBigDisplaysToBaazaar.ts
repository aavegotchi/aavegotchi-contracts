import { ethers, network } from "hardhat";
import {
  gasPrice,
  maticDiamondAddress,
  maticInstallationDiamondAddress,
} from "../helperFunctions";
import { ERC1155_BAAZAAR_CATEGORY_TO_ID } from "../../helpers/constants";

const ids: number[] = [158, 159, 160, 161];
const category = ERC1155_BAAZAAR_CATEGORY_TO_ID.INSTALLATION;

async function main() {
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
    signer = await (await ethers.getSigners())[0];
  } else {
    throw Error("Incorrect network selected");
  }

  let erc1155MarketplaceFacet = await ethers.getContractAt(
    "ERC1155MarketplaceFacet",
    maticDiamondAddress,
    signer
  );
  let tx;
  let receipt;

  interface Category {
    erc1155TokenAddress: string;
    erc1155TypeId: number;
    category: number;
  }

  const categories: Category[] = [];
  // adding installation type categories
  ids.forEach((id) => {
    categories.push({
      erc1155TokenAddress: maticInstallationDiamondAddress,
      erc1155TypeId: id,
      category: category,
    });
  });

  if (testing) {
    tx = await erc1155MarketplaceFacet.setERC1155Categories(categories);
    console.log("Adding categories for Big Displays tx:", tx.hash);
    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Adding categories failed: ${tx.hash}`);
    }
    console.log("Adding Big Displays succeeded:", tx.hash);
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

  console.log("Checking installation diamond categories...");
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const categorySaved = await erc1155MarketplaceFacet.getERC1155Category(
      maticInstallationDiamondAddress,
      id
    );

    console.log(
      categorySaved.eq(category) ? `correct: ${id}` : `incorrect: ${id}`
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
