import { task } from "hardhat/config";
import { Signer } from "@ethersproject/abstract-signer";
import {
  getDiamondSigner,
  itemManager,
  maticDiamondAddress,
} from "../scripts/helperFunctions";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { SvgFacet } from "../typechain";
import { SvgViewsFacet } from "../typechain";
import { Dimensions, SideDimensions } from "../scripts/itemTypeHelpers";

export interface UpdateItemDimensionsTaskArgs {
  itemIds: string;
  side: string;
  dimensions: string;
}

export function convertDimensionsArrayToString(
  dimensionsArray: Dimensions[]
): string {
  let outputString = "";

  dimensionsArray.forEach((d) => {
    outputString = outputString.concat(
      `#$${d.x}$${d.y}$${d.width}$${d.height}`
    );
  });

  return outputString;
}

export function convertSideDimensionsArrayToString(
  dimensionsSideArray: SideDimensions[]
): string {
  let outputString = "";

  dimensionsSideArray.forEach((d) => {
    outputString = outputString.concat(
      `#$${d.itemId}
      $${d.side}
      $${d.dimensions.x}$${d.dimensions.y}$${d.dimensions.width}$${d.dimensions.height}`
    );
  });

  return outputString;
}

export function convertStringToDimensionsArray(string: string): Dimensions[] {
  const dimensions: string[] = string
    .split("#")
    .filter((string) => string.length > 0);

  const output: Dimensions[] = [];

  dimensions.forEach((string) => {
    let array = string.split("$").filter((str) => str.length > 0);

    output.push({
      x: array[0],
      y: array[1],
      width: array[2],
      height: array[3],
    });
  });

  return output;
}

export function convertStringToSideDimensionsArray(string: string): SideDimensions[] {
  const sideDimensions: string[] = string
    .split("#")
    .filter((string) => string.length > 0);

  const output: SideDimensions[] = [];

  sideDimensions.forEach((string) => {
    let array = string.split("$").filter((str) => str.length > 0);

    output.push({
      itemId: array[0],
      side: array[1],
      dimensions: {
        x: array[2],
        y: array[3],
        width: array[4],
        height: array[5],
      },
    });
  });

  return output;
}

task(
  "updateItemDimensions",
  "Updates item dimensions, given svgId and dimensions"
)
  .addParam("itemIds", "Item IDs to update dimensions")
  .addParam("dimensions", "New dimensions of each item")

  .setAction(
    async (
      taskArgs: UpdateItemDimensionsTaskArgs,
      hre: HardhatRuntimeEnvironment
    ) => {
      const itemIds: string[] = taskArgs.itemIds.split(",");
      const dimensions: Dimensions[] = convertStringToDimensionsArray(
        taskArgs.dimensions
      );
      const sideDimensions: SideDimensions[] = convertStringToSideDimensionsArray(
        taskArgs.dimensions
      );

      const signer: Signer = await getDiamondSigner(hre, itemManager, false);

      if (taskArgs.side === "front") {
        const svgFacet = (await hre.ethers.getContractAt(
          "SvgFacet",
          maticDiamondAddress,
          signer
        )) as SvgFacet;

        let tx = await svgFacet.setItemsDimensions(itemIds, dimensions);
        console.log("tx hash:", tx.hash);
        let receipt = await tx.wait();
        console.log("New Dimensions set!");

        if (!receipt.status) {
          throw Error(`Error with transaction: ${tx.hash}`);
        }
      } else if (taskArgs.side === "left" || taskArgs.side === "right" || taskArgs.side === "back") {
        const svgViewsFacet = (await hre.ethers.getContractAt(
          "SvgViewsFacet",
          maticDiamondAddress,
          signer
        )) as SvgViewsFacet;

        let tx = await svgViewsFacet.setSideViewDimensions(sideDimensions);
        console.log("tx hash:", tx.hash);
        let receipt = await tx.wait();
        console.log("New Dimensions set!");
        if (!receipt.status) {
          throw Error(`Error with transaction: ${tx.hash}`);
        }
      }
    }
  );
