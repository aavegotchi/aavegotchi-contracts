/* global ethers hre */

async function main() {
  console.log("WHAT");
  const aavegotchiDiamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let signer;
  const owner = await (
    await ethers.getContractAt("OwnershipFacet", aavegotchiDiamondAddress)
  ).owner();

  const testing = ["hardhat", "localhost"].includes(hre.network.name);
  if (testing) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });

    signer = await ethers.provider.getSigner(owner);
  } else if (hre.network.name === "matic") {
    signer = new LedgerSigner(ethers.provider);
  } else {
    throw Error("Incorrect network selected");
  }

  const hauntSize = 15000;
  const price = ethers.utils.parseEther("0"); //no price since it'll be GBM
  const daoFacet = (
    await ethers.getContractAt("DAOFacet", aavegotchiDiamondAddress)
  ).connect(signer);
  const tx = await daoFacet.createHaunt(hauntSize, price, "0x000000", {
    gasLimit: 5000000,
  });
  const receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error creating haunt: ${tx.hash}`);
  }
  console.log("Haunt created:", tx.hash);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.

/*
main()
  .then(() => console.log("Haunt created"))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
  */

exports.createH2 = main;
