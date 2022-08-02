/* global ethers hre */
/* eslint prefer-const: "off" */
import { ethers, network } from "hardhat";
import { aavegotchiSvgs } from "../../../svgs/aavegotchi-side-typeScript";
import { Signer } from "@ethersproject/abstract-signer";

async function main() {
  console.log("Update SVG Start");
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

  async function updateSvgs(
    svg: string[],
    svgType: string,
    svgId: number,
    uploadSigner: any
  ) {
    const svgFacet = await ethers.getContractAt(
      "SvgFacet",
      diamondAddress,
      uploadSigner
    );
    let svgLength = new TextEncoder().encode(svg[svgId]).length;
    const array = [
      {
        svgType: ethers.utils.formatBytes32String(svgType),
        ids: [svgId],
        sizes: [svgLength],
      },
    ];

    let tx = await svgFacet.updateSvg(svg[svgId], array);
    let receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }
  }

  //Gotchi
  const itemIds = [2, 3];

  for (var i = 0; i < itemIds.length; i++) {
    await updateSvgs(
      aavegotchiSvgs.left,
      "aavegotchi-left",
      itemIds[i],
      signer
    );
  }

  for (var i = 0; i < itemIds.length; i++) {
    await updateSvgs(
      aavegotchiSvgs.right,
      "aavegotchi-right",
      itemIds[i],
      signer
    );
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.sideViewsGotchiSecondaryFix = main;
