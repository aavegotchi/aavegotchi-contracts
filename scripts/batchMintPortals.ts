import { ethers, network } from "hardhat";
import { openPortal } from "./query/openPortals";

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
  let shopFacet;
  let diamondAddress = "0xf81FFb9E2a72574d3C4Cf4E293D4Fec4A708F2B1";

  console.log(`Batch minting Portals to Item Manager: ${itemManager}`);

  shopFacet = await ethers.getContractAt("ShopFacet", diamondAddress, signer);

  let numberPerMint = 10;
  const maxNumber = 10; //15000;
  //Mint 2000 ERC721s

  const gameFacet = await ethers.getContractAt(
    "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
    diamondAddress
  );

  let remaining = maxNumber;

  let promises = [];
  let totalMinted = 0;

  const to = "0xAd0CEb6Dc055477b8a737B630D6210EFa76a2265";

  while (remaining > 0) {
    //Reset numberPerMint if remaining is low
    if (remaining < numberPerMint) numberPerMint = remaining;

    console.log(`Minting ${numberPerMint} Portals of ${maxNumber}!`);
    let r = await shopFacet.mintPortals(to, numberPerMint, {
      gasPrice: gasPrice,
    });
    console.log("tx hash:", r.hash);
    totalMinted += numberPerMint;
    remaining -= numberPerMint;
    totalGasUsed = totalGasUsed.add(r.gasLimit);
    promises.push(r);
    console.log("Total minted:", totalMinted);
    const balance = await gameFacet.balanceOf(to);
    console.log("Balance of Item Manager:", balance.toString());
  }

  await Promise.all(promises);

  console.log("Used Gas:", totalGasUsed.toString());
}

batchMintPortals()
  .then(() => process.exit(1))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.deploy = batchMintPortals;
