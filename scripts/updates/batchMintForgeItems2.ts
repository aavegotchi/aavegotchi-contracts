import { ethers, network } from "hardhat";
import { itemManagerAlt, maticForgeDiamond } from "../helperFunctions";
import { ForgeFacet, ForgeTokenFacet } from "../../typechain";

export async function batchMintForgeItems() {
  let signer;
  const testing = ["hardhat", "localhost"].includes(network.name);
  if (testing) {
    const ownershipFacet = await ethers.getContractAt(
      "OwnershipFacet",
      maticForgeDiamond
    );
    const owner = await ownershipFacet.owner();

    console.log("current owner:", owner);

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });
    signer = await ethers.provider.getSigner(owner);
  } else if (network.name === "matic") {
    const accounts = await ethers.getSigners();
    signer = accounts[0];
    throw Error("Incorrect network selected");
  }

  let forgeFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/ForgeDiamond/facets/ForgeFacet.sol:ForgeFacet",
    maticForgeDiamond,
    signer
  )) as ForgeFacet;

  const tokenIds = [];
  const tokenAmounts = [];

  // schematics
  const common = [370, 371, 372, 375];
  const uncommon = [373, 377];
  const rare = [374, 376, 378, 379];
  const legendary = [380, 381, 382, 383];
  const mythical = [384];
  const godlike = [385, 386, 387];
  const ids = [common, uncommon, rare, legendary, mythical, godlike];
  const totalAmounts = [1000, 500, 250, 100, 50, 5];

  const percents = [0.4, 0.6];
  const receipients = [itemManagerAlt, maticForgeDiamond];

  for (let j = 0; j < receipients.length; j++) {
    const transferAmount = [];
    const transferIds = [];

    const recipient = receipients[j];
    const percent = percents[j];

    for (let i = 0; i < ids.length; i++) {
      if (totalAmounts[i] === 0) {
        continue;
      }
      for (let j = 0; j < ids[i].length; j++) {
        transferIds.push(ids[i][j]);
        transferAmount.push(totalAmounts[i] * percent);
      }
    }

    console.log(
      `Batch minting to ${recipient}: ${transferIds} ${transferAmount}`
    );

    const tx = await forgeFacet.adminMintBatch(
      recipient,
      transferIds,
      transferAmount
    );
    const receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Error with transaction: ${tx.hash}`);
    }

    let forgeTokenFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/ForgeDiamond/facets/ForgeTokenFacet.sol:ForgeTokenFacet",
      maticForgeDiamond,
      signer
    )) as ForgeTokenFacet;
    const balance = await forgeTokenFacet.balanceOfOwner(recipient);
    console.log("balance", balance);
  }
}

if (require.main === module) {
  batchMintForgeItems()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
