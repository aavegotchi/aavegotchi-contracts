import { ethers, network, run } from "hardhat";
import {
  ERC721MarketplaceFacet,
} from "../../typechain";
import {
  maticFakeGotchiArt,
  gasPrice,
  maticDiamondAddress, maticFakeGotchiCards
} from "../helperFunctions";
import { Signer } from "@ethersproject/abstract-signer";

export async function main() {

  let itemManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
  let signer: Signer;

  const testing = ["hardhat", "localhost"].includes(network.name);

  if (testing) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManager],
    });
    signer = await ethers.getSigner(itemManager);
  } else if (network.name === "matic") {
    const accounts = await ethers.getSigners();
    signer = accounts[0];

    console.log("signer:", signer);
  } else {
    throw Error("Incorrect network selected");
  }

  let tx;
  let receipt;
  let categories;

  console.log("Add categories for FAKE gotchis NFTs");
  const erc721MarketplaceFacet = await ethers.getContractAt('ERC721MarketplaceFacet', maticDiamondAddress, signer)
  categories = [
    {
      erc721TokenAddress: maticFakeGotchiArt,
      category: 5,
    },
  ];
  tx = await erc721MarketplaceFacet.setERC721Categories(categories, {
    gasPrice: gasPrice,
  });
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Not Sent: ${tx.hash}`);
  }
  console.log("Added categories for FAKE gotchis NFTs successfully");

  console.log("Add categories for FAKE gotchis cards");
  const erc1155MarketplaceFacet = await ethers.getContractAt('ERC1155MarketplaceFacet', maticDiamondAddress, signer)
  categories = [
    {
      erc1155TokenAddress: maticFakeGotchiCards,
      erc1155TypeId: 0,
      category: 6,
    },
  ];
  tx = await erc1155MarketplaceFacet.setERC1155Categories(categories, {
    gasPrice: gasPrice,
  });
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Not Sent: ${tx.hash}`);
  }
  console.log("Added categories for FAKE gotchis cards successfully");
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
