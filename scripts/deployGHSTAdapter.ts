import { Signer } from "@ethersproject/abstract-signer";

import { ethers, network } from "hardhat";
import { maticDiamondAddress } from "./helperFunctions";
import { ghstAddress } from "../helpers/constants";

async function deployGHSTAdapter() {
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
    //we are only deploying on polygon
  } else if (network.name === "matic") {
    signer = accounts[0];
  } else {
    throw Error("Incorrect network selected");
  }

  const GHSTOFTAdapter = await ethers.getContractFactory("GHSTOFTAdapter");

  const polygonLZEndpoint = "0x3c2269811836af69497E5F486A85D7316753cf62";

  const ghstOftAdapter = await GHSTOFTAdapter.deploy(
    ghstAddress,
    polygonLZEndpoint,
    owner
  );
}

deployGHSTAdapter()
  .then(() => process.exit(1))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
