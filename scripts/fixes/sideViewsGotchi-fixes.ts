// update gotchi body
import { run, ethers, network } from "hardhat";
import { aavegotchiSvgs } from "../../svgs/aavegotchi-side-typeScript";
import { UpdateSvgsTaskArgs } from "../../tasks/updateSvgs";
import { SvgFacet } from "../../typechain";
import { updateSvgs, uploadOrUpdateSvg } from "../svgHelperFunctions";
import { Signer } from "@ethersproject/abstract-signer";

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

  const svgFacet = (await ethers.getContractAt(
    "SvgFacet",
    diamondAddress,
    signer
  )) as SvgFacet;

  const itemIds = [2, 3];
  const sides = ["left", "right"];
  const sideArrays = [aavegotchiSvgs.left, aavegotchiSvgs.right];

  /*   for (let index = 0; index < itemIds.length; index++) {
    const itemId = itemIds[index];
    for (let index = 0; index < sides.length; index++) {
      const side = sides[index];
      const sideArray = sideArrays[index];

      let taskArgsSidesLeft: UpdateSvgsTaskArgs = {
        svgIds: [itemId].join(","),
        svgType: `aavegotchi-${side}`,
        svgs: [sideArray].join("***"),
      };

      await run("updateSvgs", taskArgsSidesLeft);
    }
  } */

  for (let index = 0; index < sides.length; index++) {
    const side = sides[index];
    const sideArray = sideArrays[index];
    const left = aavegotchiSvgs.left;
    const right = aavegotchiSvgs.right;

    await updateSvgs(
      aavegotchiSvgs.left,
      `aavegotchi-${side}`,
      itemIds,
      svgFacet,
      ethers
    );
  }

  /*   for (let index = 0; index < itemIds.length; index++) {
    const itemId = itemIds[index];
    let taskArgsSidesRight: UpdateSvgsTaskArgs = {
      svgIds: [itemId].join(","),
      svgType: `aavegotchi-right`,
      svgs: [aavegotchiSvgs.right].join("***"),
    };

    await run("updateSvgs", taskArgsSidesRight);
  } */
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.gotchiSideViewFixes = main;
