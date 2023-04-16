import { LedgerSigner } from "@anders-t/ethers-ledger";
import { BigNumber, Signer } from "ethers";
import { ethers, network } from "hardhat";
import { DAOFacet, MerkleDropFacet, OwnershipFacet } from "../typechain";
import {
  gasPrice,
  impersonate,
  maticDiamondAddress,
  xpRelayerAddress,
} from "./helperFunctions";

async function main() {
  let signer: Signer = new LedgerSigner(ethers.provider);
  let ownerShip = (await ethers.getContractAt(
    "OwnershipFacet",
    maticDiamondAddress
  )) as OwnershipFacet;

  let dropFacet: MerkleDropFacet;

  if (network.name === "hardhat") {
    const owner = await ownerShip.owner();
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });
    signer = await ethers.provider.getSigner(owner);
  }

  console.log("Deploying an xp airdrop");

  const propId =
    "0x9036ec1b899d16cdf2845a54555129303d133d19d7ad5d790f0aaed1b6d48913";
  const xpAmount = "0";
  const root =
    "0xb5f23f843ba6df7f7c24ac4d03b29b71ee6c70b880190171f082432c82984d28";

  dropFacet = (await ethers.getContractAt(
    "MerkleDropFacet",
    maticDiamondAddress,
    signer
  )) as MerkleDropFacet;

  if (network.name === "hardhat") {
    dropFacet = await impersonate(
      await ownerShip.owner(),
      dropFacet,
      ethers,
      network
    );
  }

  const tx = await dropFacet.createXPDrop(propId, root, xpAmount);
  const tx2 = await tx.wait();
  console.log("added xp at hash", tx.hash);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
