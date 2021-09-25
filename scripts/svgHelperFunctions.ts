import { BigNumberish } from "@ethersproject/bignumber";
import { BytesLike } from "@ethersproject/bytes";

const fs = require("fs");
import { SleeveObject } from "./itemTypeHelpers";

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
  svgs: string[],
  ethers: any
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

export function printSizeInfo(
  svgType: string,
  sizes: BigNumberish[]
  // ethers: any
) {
  console.log("------------- SVG Size Info ---------------");
  let totalSize = 0;
  for (const size of sizes) {
    console.log(svgType + ":" + size);
    // for (const nextSize of size) {
    totalSize += Number(size.toString());
    // }
  }
  console.log("Total sizes:" + sizes);
}

export function stripSvg(svg: string) {
  // removes svg tag
  if (svg.includes("viewBox")) {
    svg = svg.slice(svg.indexOf(">") + 1);
    svg = svg.replace("</svg>", "");
  }
  return svg;
}

export function readSvg(name: string, folder: string) {
  //folder is usually svgItems but could also be svgItems/subfolder
  return stripSvg(fs.readFileSync(`./svgs/${folder}/${name}.svg`, "utf8"));
}

export function wearable(name: string, folder: string) {
  const svg = readSvg(name, folder);
  return svg;
}

export interface BodyWearableOutput {
  wearable: string;
  sleeves: SleeveObject;
}

export function bodyWearable(name: string, folder: string): BodyWearableOutput {
  let baseSvg = readSvg(name, folder);
  // console.log(name, svg.length)
  const id = name.slice(0, name.indexOf("_"));
  const leftSleevesUp =
    '<g class="gotchi-sleeves gotchi-sleeves-left gotchi-sleeves-up">' +
    readSvg(`${name}LeftUp`, folder) +
    "</g>";
  const leftSleeves =
    '<g class="gotchi-sleeves gotchi-sleeves-left gotchi-sleeves-down">' +
    readSvg(`${name}Left`, folder) +
    "</g>";
  const rightSleevesUp =
    '<g class="gotchi-sleeves gotchi-sleeves-right gotchi-sleeves-up">' +
    readSvg(`${name}RightUp`, folder) +
    "</g>";
  const rightSleeves =
    '<g class="gotchi-sleeves gotchi-sleeves-right gotchi-sleeves-down">' +
    readSvg(`${name}Right`, folder) +
    "</g>";
  let sleevesSvg =
    "<g>" +
    leftSleevesUp +
    leftSleeves +
    rightSleevesUp +
    rightSleeves +
    "</g>";

  return { wearable: baseSvg, sleeves: { id: id, svg: sleevesSvg } };
}

export interface UpdateSvgPayload {
  svgType: BytesLike;
  ids: string[];
  sizes: number[];
}

export function updateSvgsPayload(
  svg: string,
  svgType: string,
  svgId: string,
  ethers: any
): UpdateSvgPayload {
  let svgLength = new TextEncoder().encode(svg).length;
  const payload = {
    svgType: ethers.utils.formatBytes32String(svgType),
    ids: [svgId],
    sizes: [svgLength],
  };

  return payload;
}

export function svgTypeToBytes(svgType: string, ethers: any): BytesLike {
  return ethers.utils.formatBytes32String(svgType);
}
