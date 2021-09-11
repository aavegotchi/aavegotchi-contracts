import { BigNumberish } from "@ethersproject/bignumber";
import { BytesLike } from "@ethersproject/bytes";
import { ethers } from "hardhat";

export interface SvgTypesAndSizes {
  svgType: BytesLike;
  sizes: BigNumberish[];
}

export interface SvgTypesAndSizesOutput {
  svg: string;
  svgTypesAndSizes: SvgTypesAndSizes[];
}

export function setupSvg(
  svgType: string,
  svgs: string[]
): SvgTypesAndSizesOutput {
  const svgTypesAndSizes: SvgTypesAndSizes[] = [];
  const svgItems = [];

  svgItems.push(svgs.join(""));
  svgTypesAndSizes.push({
    svgType: ethers.utils.formatBytes32String(svgType),
    sizes: svgs.map((value: string) => value.length),
  });

  return {
    svg: svgItems.join(""),
    svgTypesAndSizes: svgTypesAndSizes,
  };

  // return [svgItems.join(""), svgTypesAndSizes];
}

export function printSizeInfo(svgType: BytesLike, sizes: BigNumberish[]) {
  console.log("------------- SVG Size Info ---------------");
  let totalSize = 0;
  for (const size of sizes) {
    console.log(ethers.utils.parseBytes32String(svgType) + ":" + size);
    // for (const nextSize of size) {
    totalSize += Number(size.toString());
    // }
  }
  console.log("Total sizes:" + sizes);
}
