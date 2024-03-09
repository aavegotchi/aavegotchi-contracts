import { Signer } from "@ethersproject/abstract-signer";

import { ethers, network } from "hardhat";
import { maticDiamondAddress } from "./helperFunctions";
import { ghstAddress } from "../helpers/constants";

async function deployGHSTOFT() {
  const accounts = await ethers.getSigners();

  let testing = ["hardhat"].includes(network.name);
  let signer: Signer;

  let ownerFacet = await ethers.getContractAt(
    "OwnershipFacet",
    maticDiamondAddress
  );
  const owner = await ownerFacet.owner();

  if (testing) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });
    signer = await ethers.provider.getSigner(owner);

    //use default signer for base for now
  } else if (network.name === "base") {
    signer = accounts[0];
  } else {
    throw Error("Incorrect network selected");
  }

  const GHSTOFT = await ethers.getContractFactory("GHSTOFT");

  const baseLZEndpoint = "0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7";

  const ghstoft = await GHSTOFT.deploy(
    "Aavegotchi(GHST) Token",
    "GHST",
    baseLZEndpoint,
    owner
  );

  //after deployment we need to set the ghst contract on polygon as a trusted pair
  // await ghstoft.setPeer(109, ghstAddress);
}

deployGHSTOFT()
  .then(() => process.exit(1))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
