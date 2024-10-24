const { NonceManager } = require("@ethersproject/experimental");

async function batchMintPortals() {
  const accounts = await ethers.getSigners();
  const account = await accounts[0].getAddress();

  console.log("account:", account);

  let nonceManagedSigner;
  const itemManager = "0xd38Df837a1EAd12ee16f8b8b7E5F58703f841668";
  let diamondAddress = "0x87C969d083189927049f8fF3747703FB9f7a8AEd";

  const gasPrice = 50000000000;

  let testing = ["hardhat"].includes(hre.network.name);

  if (testing) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManager],
    });
    signer = await ethers.provider.getSigner(itemManager);
    nonceManagedSigner = new NonceManager(signer);
  } else if (hre.network.name === "base-sepolia") {
    signer = accounts[0]; // new ethers.Wallet(process.env.ITEM_MANAGER);
  } else {
    throw Error("Incorrect network selected");
  }

  console.log("Deploying Account: " + itemManager + "\n---");

  let totalGasUsed = ethers.BigNumber.from("0");

  console.log(`Batch minting Portals to Item Manager: ${itemManager}`);

  const shopFacet = await ethers.getContractAt(
    "ShopFacet",
    diamondAddress,
    nonceManagedSigner
  );
  const vrfFacet = await ethers.getContractAt(
    "VrfFacet",
    diamondAddress,
    nonceManagedSigner
  );
  const gameFacet = await ethers.getContractAt(
    "AavegotchiGameFacet",
    diamondAddress,
    nonceManagedSigner
  );
  const aavegotchiFacet = await ethers.getContractAt(
    "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
    diamondAddress
  );
  const ghstFacet = await ethers.getContractAt(
    "GHSTFacet",
    "0xe97f36a00058aa7dfc4e85d23532c3f70453a7ae"
  );
  await ghstFacet.approve(diamondAddress, ethers.utils.parseEther("100000000000000000000000"));

  let numberPerMint = 50;
  const maxNumber = 500; //15000;
  //Mint 2000 ERC721s

  let remaining = maxNumber;

  let promises = [];
  let totalMinted = 0;

  while (remaining > 0) {
    //Reset numberPerMint if remaining is low
    if (remaining < numberPerMint) numberPerMint = remaining;

    console.log(`Minting ${numberPerMint} Portals of ${maxNumber}!`);
    let r = await shopFacet.mintPortals(itemManager, numberPerMint, {
      gasPrice: gasPrice,
    });
    console.log("tx hash:", r.hash);
    totalMinted += numberPerMint;
    remaining -= numberPerMint;
    totalGasUsed = totalGasUsed.add(r.gasLimit);
    promises.push(r);
    console.log("Total minted:", totalMinted);
    const balance = await aavegotchiFacet.balanceOf(itemManager);
    console.log("Balance of Item Manager:", balance.toString());
  }

  await Promise.all(promises);

  // open portals
  const startId = 50
  for (let i = 0; i < 5; i++) {
    let r = await vrfFacet.openPortals(Array.from({ length: 20 }, (_, j) => j + startId + i * 20), {
      gasPrice: gasPrice,
    });
    console.log(`open portal from ${startId + i * 20}: tx hash:`, r.hash);
  }

  // claim gotchis
  for (let i = 100; i < 150; i++) {
    const gotchis = await gameFacet.portalAavegotchiTraits(i)
    const selectedGotchi = gotchis[0]
    let r = await gameFacet.claimAavegotchi(i, 0, selectedGotchi.minimumStake,  {
      gasPrice: gasPrice,
    });
    console.log(`claimAavegotchi ${i}: tx hash:`, r.hash);
  }


  console.log("Used Gas:", totalGasUsed.toString());
}

batchMintPortals()
  .then(() => process.exit(1))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.deploy = batchMintPortals;
