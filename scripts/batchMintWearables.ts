import { ethers, network } from "hardhat";
import { openPortal } from "./query/openPortals";
import { networkAddresses } from "../helpers/constants";
import { ERC20 } from "../typechain";

async function batchMintPortals() {
  const accounts = await ethers.getSigners();
  const account = await accounts[0].getAddress();

  console.log("account:", account);

  const itemManager = "0xd38Df837a1EAd12ee16f8b8b7E5F58703f841668";

  const gasPrice = 150000000000;
  let signer;

  let testing = ["hardhat"].includes(network.name);

  if (testing) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManager],
    });
    signer = await ethers.provider.getSigner(itemManager);
  } else if (network.name === "matic") {
    signer = accounts[0]; // new ethers.Wallet(process.env.ITEM_MANAGER);
  } else if (network.name === "baseSepolia") {
    signer = accounts[0];
  } else {
    throw Error("Incorrect network selected");
  }

  console.log("Deploying Account: " + itemManager + "\n---");

  let totalGasUsed = ethers.BigNumber.from("0");
  let diamondAddress = "0xf81FFb9E2a72574d3C4Cf4E293D4Fec4A708F2B1";

  console.log(`Batch minting Portals to Item Manager: ${itemManager}`);

  const ids = [60, 61, 62];
  const amounts = [1, 1, 1];

  let numberPerMint = 10;
  const maxNumber = 10; //15000;
  //Mint 2000 ERC721s

  const ghstContractAddress = networkAddresses[84532].ghst;

  const erc20Contract = (await ethers.getContractAt(
    "ERC20Token",
    ghstContractAddress,
    signer
  )) as ERC20;

  const balance = await erc20Contract.balanceOf(itemManager);
  console.log("Balance of GHST:", balance.toString());

  await erc20Contract.approve(diamondAddress, balance);

  const shopFacet = await ethers.getContractAt(
    "ShopFacet",
    diamondAddress,
    signer
  );

  const to = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";

  await shopFacet.purchaseItemsWithGhst(to, ids, amounts);

  console.log("Used Gas:", totalGasUsed.toString());
}

batchMintPortals()
  .then(() => process.exit(1))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.deploy = batchMintPortals;
