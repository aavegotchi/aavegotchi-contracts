//updating ID 8(marine jacket) front sleeves

import { Signer } from "@ethersproject/abstract-signer";
import { LedgerSigner } from "@ethersproject/hardware-wallets";
import { run, network, ethers } from "hardhat";

import { DAOFacet, GotchiLendingFacet } from "../../typechain";
import { maticDiamondAddress } from "../helperFunctions";

async function main() {
  const listingIds = [
    {
      id: "2483",
    },
    {
      id: "253",
    },
    {
      id: "254",
    },
    {
      id: "313",
    },
    {
      id: "343",
    },
    {
      id: "374",
    },
    {
      id: "470",
    },
    {
      id: "487",
    },
    {
      id: "506",
    },
    {
      id: "511",
    },
    {
      id: "518",
    },
    {
      id: "75",
    },
    {
      id: "838",
    },
  ];

  const newRevenueTokens = [
    "0x403E967b044d4Be25170310157cB1A4Bf10bdD0f",
    "0x44A6e0BE76e1D9620A7F76588e4509fE4fa8E8C8",
    "0x6a3E7C3c6EF65Ee26975b12293cA1AAD7e1dAeD2",
    "0x42E5E06EF5b90Fe15F853F59299Fc96259209c5C",
  ];

  let signer: Signer;

  let owner = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
  const testing = ["hardhat", "localhost"].includes(network.name);
  if (testing) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });
    signer = await ethers.provider.getSigner(owner);
  } else if (network.name === "matic") {
    signer = new LedgerSigner(ethers.provider, "hid", "m/44'/60'/2'/0/0");
  } else {
    throw Error("Incorrect network selected");
  }

  const lendingFacet = (await ethers.getContractAt(
    "GotchiLendingFacet",
    maticDiamondAddress,
    signer
  )) as GotchiLendingFacet;

  let listing = await lendingFacet.getLendingListingInfo("2483");

  console.log("before listing:", listing);

  const tx = await lendingFacet.emergencyChangeRevenueTokens(
    listingIds.map((val) => val.id),
    newRevenueTokens
  );
  await tx.wait();

  listing = await lendingFacet.getLendingListingInfo("2483");

  console.log("after isting:", listing);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.marineJacketSleeveFix = main;
