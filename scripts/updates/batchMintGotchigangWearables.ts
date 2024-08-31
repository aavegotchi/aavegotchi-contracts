import { ethers, network } from "hardhat";
import {
  gasPrice,
  itemManagerAlt,
  maticForgeDiamond,
} from "../helperFunctions";
import { ForgeFacet, ForgeTokenFacet } from "../../typechain";
import { LedgerSigner } from "@anders-t/ethers-ledger";
import { BigNumberish } from "ethers";
import { sendWearablesToForge } from "./sendWearablesToForge";

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
    //item manager - ledger
    signer = new LedgerSigner(ethers.provider, "m/44'/60'/1'/0/0");
  } else throw Error("Incorrect network selected");

  let forgeFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/ForgeDiamond/facets/ForgeFacet.sol:ForgeFacet",
    maticForgeDiamond,
    signer
  )) as ForgeFacet;

  // schematics
  const common = [404, 405, 406];
  const uncommon = [407, 408, 409, 410];
  const rare = [411, 412, 413];
  const legendary = [414, 415];
  const mythical = [416, 417];

  const ids = [common, uncommon, rare, legendary, mythical];
  const totalAmounts = [1000, 500, 250, 100, 10] as BigNumberish[];

  for (let i = 0; i < ids.length; i++) {
    console.log(
      `Batch minting to ${itemManagerAlt}: ${ids[i]} ${totalAmounts[i]}`
    );
    let amounts: BigNumberish[] = new Array(ids[i].length);

    amounts.fill(totalAmounts[i], 0, ids[i].length);
    console.log(amounts);
    const tx = await forgeFacet.adminMintBatch(
      itemManagerAlt,
      ids[i],
      amounts,
      { gasPrice: gasPrice }
    );
    console.log("tx hash:", tx.hash);
    const receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Error with transaction: ${tx.hash}`);
    }
  }

  let forgeTokenFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/ForgeDiamond/facets/ForgeTokenFacet.sol:ForgeTokenFacet",
    maticForgeDiamond,
    signer
  )) as ForgeTokenFacet;
  const balance = await forgeTokenFacet.balanceOfOwner(itemManagerAlt);
  console.log("balance", balance);

  //disburse to forge
  await sendWearablesToForge();
}

if (require.main === module) {
  batchMintForgeItems()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
