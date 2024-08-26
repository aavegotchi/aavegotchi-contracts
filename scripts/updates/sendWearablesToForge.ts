import { ethers, network } from "hardhat";
import {
  gasPrice,
  itemManagerAlt,
  maticForgeDiamond,
} from "../helperFunctions";
import { ForgeTokenFacet } from "../../typechain";
import { LedgerSigner } from "@anders-t/ethers-ledger";

export async function sendWearablesToForge() {
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

  let forgeTokenFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/ForgeDiamond/facets/ForgeTokenFacet.sol:ForgeTokenFacet",
    maticForgeDiamond,
    signer
  )) as ForgeTokenFacet;

  let forgeAddress1 = "0x4a478E4593A5D557dB640642c34Ae52800084451";
  let forgeAddress2 = "0x511997786FfBb021ACCC73e121411dABFc320BC8";

  // schematics
  const common = [388, 389, 390];
  const uncommon = [391, 392, 393, 394];
  const rare = [395, 396, 397];
  const legendary = [398, 399];
  const mythical = [400, 401];

  const ids1 = [...common, ...uncommon, ...rare];
  const ids2 = [...common, ...uncommon, ...rare, ...legendary, ...mythical];

  const amounts1 = [52, 42, 26, 20, 19, 25, 12, 10, 10, 5];
  const amounts2 = [100, 100, 100, 50, 50, 50, 50, 25, 25, 25, 10, 10, 5, 5];

  let tx = await forgeTokenFacet.safeBatchTransferFrom(
    itemManagerAlt,
    forgeAddress1,
    ids1,
    amounts1,
    "",
    { gasPrice: gasPrice }
  );
  console.log("tx hash:", tx.hash);
  const receipt = await tx.wait();

  if (!receipt.status) {
    throw Error(`Error with transaction: ${tx.hash}`);
  }

  tx = await forgeTokenFacet.safeBatchTransferFrom(
    itemManagerAlt,
    forgeAddress2,
    ids2,
    amounts2,
    "",
    { gasPrice: gasPrice }
  );
  console.log("tx hash:", tx.hash);
  const receipt2 = await tx.wait();

  if (!receipt2.status) {
    throw Error(`Error with transaction: ${tx.hash}`);
  }
}

if (require.main === module) {
  sendWearablesToForge()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
