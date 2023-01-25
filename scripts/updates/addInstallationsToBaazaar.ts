import { ethers, network } from "hardhat";
import { gasPrice } from "../helperFunctions";

/* TODO: replace follwowing values */
const installationDiamond = "0x19f870bD94A34b3adAa9CaA439d333DA18d6812A";
const ids: number[] = [
  141, 142, 143, 144, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156,
];
const category = 4;
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
    signer = await (await ethers.getSigners())[0];
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

  interface Category {
    erc1155TokenAddress: string;
    erc1155TypeId: number;
    category: number;
  }

  const categories: Category[] = [];
  // adding installation type categories
  ids.forEach((id) => {
    categories.push({
      erc1155TokenAddress: installationDiamond,
      erc1155TypeId: id,
      category: category,
    });
  });

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

      //@ts-ignore
      // await sendToMultisig(process.env.DIAMOND_UPGRADER, signer, tx, ethers);
    } catch (error) {
      console.log("error:", error);
    }
  }

  console.log("Checking installation diamond categories...");
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const categorySaved = await erc1155MarketplaceFacet.getERC1155Category(
      installationDiamond,
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
