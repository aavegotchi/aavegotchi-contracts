import { ethers, network, run } from "hardhat";
import { Signer } from "@ethersproject/abstract-signer";
import { aavegotchiUpdateForSvgTask } from "../svgHelperFunctions";

async function main() {
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let itemManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
  let signer: Signer;

  const testing = ["hardhat", "localhost"].includes(network.name);

  if (testing) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManager],
    });
    signer = await ethers.getSigner(itemManager);
  } else if (network.name === "matic") {
    const accounts = await ethers.getSigners();
    signer = accounts[0]; //new LedgerSigner(ethers.provider);

    console.log("signer:", signer);
  } else {
    throw Error("Incorrect network selected");
  }

  console.log("Update SVG Start");

  const aavegotchiIds: number[] = [3];

  const aavegotchiLeftFix = await aavegotchiUpdateForSvgTask(
    aavegotchiIds,
    "left"
  );
  const aavegotchiRightFix = await aavegotchiUpdateForSvgTask(
    aavegotchiIds,
    "right"
  );

  await run("updateSvgs", aavegotchiLeftFix);
  await run("updateSvgs", aavegotchiRightFix);

  const svgViewsFacet = await ethers.getContractAt(
    "SvgViewsFacet",
    diamondAddress,
    signer
  );

  // // **** Test ****
  // // BODY = 0;
  // // FACE = 1;
  // // EYES = 2;
  // // HEAD = 3;
  // // RIGHT = 4;
  // // LEFT = 5;
  // // PET = 6;
  // // BG = 7;

  let numTraits1: [number, number, number, number, number, number] = [
    99, 99, 99, 99, 12, 9,
  ];
  let wearables1: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
  ] = [22, 0, 0, 0, 217, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const sidePreview = await svgViewsFacet.previewSideAavegotchi(
    "2",
    "0xE0b22E0037B130A9F56bBb537684E6fA18192341",
    numTraits1,
    wearables1
  );
  console.log("Side Preview: ", sidePreview);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
