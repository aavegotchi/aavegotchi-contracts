import { ethers, network } from "hardhat";
import {
  gasPrice,
  impersonate,
  maticDiamondAddress,
  maticForgeDiamond,
  maticWearableDiamondAddress,
} from "../helperFunctions";
import { LedgerSigner } from "@anders-t/ethers-ledger";
import { DAOFacet, ForgeDAOFacet, WearablesFacet } from "../../typechain";

export async function lockDiamonds() {
  let signer;

  const testing = ["hardhat", "localhost"].includes(network.name);

  let aavegotchiDiamond: DAOFacet;
  let forgeDiamond: ForgeDAOFacet;
  let wearableDiamond: WearablesFacet;

  aavegotchiDiamond = (await ethers.getContractAt(
    "DAOFacet",
    maticDiamondAddress
  )) as DAOFacet;

  wearableDiamond = await ethers.getContractAt(
    "WearablesFacet",
    maticWearableDiamondAddress
  );

  forgeDiamond = await ethers.getContractAt("ForgeDAOFacet", maticForgeDiamond);

  if (testing) {
    const aavegotchiDiamondOwner = await getOwner(maticDiamondAddress);

    console.log("aavegotchiDiamondOwner", aavegotchiDiamondOwner);

    aavegotchiDiamond = await impersonate(
      aavegotchiDiamondOwner,
      aavegotchiDiamond,
      ethers,
      network
    );

    const forgeDiamondOwner = await getOwner(maticForgeDiamond);

    console.log("forgeDiamondOwner", forgeDiamondOwner);

    forgeDiamond = await impersonate(
      forgeDiamondOwner,
      forgeDiamond,
      ethers,
      network
    );

    const wearableDiamondOwner = await getOwner(maticWearableDiamondAddress);

    console.log("wearableDiamondOwner", wearableDiamondOwner);

    wearableDiamond = await impersonate(
      wearableDiamondOwner,
      wearableDiamond,
      ethers,
      network
    );
  } else if (network.name === "matic") {
    //item manager - ledger
    signer = new LedgerSigner(ethers.provider, "m/44'/60'/1'/0/0");
  } else throw Error("Incorrect network selected");

  let tx = await aavegotchiDiamond
    .connect(signer)
    .toggleDiamondPaused(true, { gasPrice: gasPrice });
  await tx.wait();
  console.log("Aavegotchi diamond paused at txn", tx.hash);
  tx = await wearableDiamond
    .connect(signer)
    .toggleDiamondPaused(true, { gasPrice: gasPrice });
  await tx.wait();
  console.log("Wearable diamond paused at txn", tx.hash);
  tx = await forgeDiamond.connect(signer).pauseContract({ gasPrice: gasPrice });
  await tx.wait();
  console.log("Forge diamond paused at txn", tx.hash);
  console.log("Diamonds paused");
}

async function getOwner(address: string) {
  const ownershipFacet = await ethers.getContractAt("OwnershipFacet", address);
  const owner = await ownershipFacet.owner();
  return owner;
}

if (require.main === module) {
  lockDiamonds()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
