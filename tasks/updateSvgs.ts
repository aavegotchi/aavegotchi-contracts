import { task } from "hardhat/config";
import { Signer } from "@ethersproject/abstract-signer";
import { maticDiamondAddress } from "../scripts/helperFunctions";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { uploadOrUpdateSvg } from "../scripts/svgHelperFunctions";
import { SvgFacet } from "../typechain";
import { getRelayerSigner } from "../scripts/helperFunctions";

export interface UpdateSvgsTaskArgs {
  svgIds: string;
  svgs: string;
  svgType: string;
}

task("updateSvgs", "Updates SVGs, given svgType and a list of IDs")
  .addParam("svgIds", "List of SVG IDs to add or update")
  .addParam("svgType", "Type of SVG")
  .addParam("svgs", "SVG files in a string array")

  .setAction(
    async (taskArgs: UpdateSvgsTaskArgs, hre: HardhatRuntimeEnvironment) => {
      const svgIDs: string[] = taskArgs.svgIds
        .split(",")
        .filter((str) => str.length > 0);
      const svgs: string[] = taskArgs.svgs
        .split("***")
        .filter((str) => str.length > 0);
      const svgType: string = taskArgs.svgType;

      const signer: Signer = await getRelayerSigner(hre);

      const svgFacet = (await hre.ethers.getContractAt(
        "SvgFacet",
        maticDiamondAddress,
        signer
      )) as SvgFacet;

      //todo: Handle more than one SVG at a time
      const idsArray: number[] = [];
      console.log("SvgIDs length: ", svgIDs.length);
      console.log("Svgs length: ", svgs.length);

      for (let i = 0; i < svgIDs.length; i++) {
        idsArray.push(Number(svgIDs[i]));
      }

      /* console.log("Updating SVG for id: ", svgId); */

      try {
        await uploadOrUpdateSvg(svgs, svgType, idsArray, svgFacet, hre.ethers);
      } catch (error) {
        console.log("error uploading", svgIDs, error);
      }
    }
  );
