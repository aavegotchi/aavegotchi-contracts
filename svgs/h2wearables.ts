/* eslint-disable  prefer-const */

import { SleeveObject } from "../scripts/itemTypeHelpers";

const fs = require("fs");

export const wearables: string[] = [];
export const sleeves: SleeveObject[] = [];

wearable("211_GuyFauwkesMask");
wearable("212_1337Laptop");
bodyWearable("213_H4xx0rShirt");
wearable("214_MatrixEyes");
wearable("215_CyborgEye");
wearable("216_RainbowVomit");
wearable("217_EnergyBlaster");
wearable("218_Mohawk");
wearable("219_MuttonChops");
bodyWearable("220_PunkShirt");
wearable("221_PirateHat");
bodyWearable("222_PirateCoat");
wearable("223_HookHand");
wearable("224_PiratePatch");
wearable("225_Basketball");
wearable("226_RedHeadband");
wearable("227_MJJersey");
wearable("228_10GallonHat");
wearable("229_Lasso");
wearable("230_WraanglerJeans");
bodyWearable("231_ComfyPoncho");
wearable("232_PonchoHoodie");
wearable("233_UncommonCacti");
bodyWearable("234_ShaamanPoncho");
wearable("235_ShaamanHoodie");
wearable("236_BlueCacti");
wearable("237_MythicalCacti");
wearable("238_GodlikeCacti");
wearable("239_WagieCap");
wearable("240_Headphones");
bodyWearable("241_WGMIShirt");
wearable("242_YellowManbun");
wearable("243_TintedShades");
bodyWearable("244_VNeckShirt");

function stripSvg(svg: string) {
  // removes svg tag
  if (svg.includes("viewBox")) {
    svg = svg.slice(svg.indexOf(">") + 1);
    svg = svg.replace("</svg>", "");
  }
  return svg;
}

function readSvg(name: string) {
  return stripSvg(fs.readFileSync(`./svgs/svgItems/${name}.svg`, "utf8"));
}

function wearable(name: string) {
  const svg = readSvg(name);
  wearables.push(svg);
}

function bodyWearable(name: string) {
  let svg = readSvg(name);
  // console.log(name, svg.length)
  const id = name.slice(0, name.indexOf("_"));
  wearables.push(svg);
  const leftSleevesUp =
    '<g class="gotchi-sleeves gotchi-sleeves-left gotchi-sleeves-up">' +
    readSvg(`${name}LeftUp`) +
    "</g>";
  const leftSleeves =
    '<g class="gotchi-sleeves gotchi-sleeves-left gotchi-sleeves-down">' +
    readSvg(`${name}Left`) +
    "</g>";
  const rightSleevesUp =
    '<g class="gotchi-sleeves gotchi-sleeves-right gotchi-sleeves-up">' +
    readSvg(`${name}RightUp`) +
    "</g>";
  const rightSleeves =
    '<g class="gotchi-sleeves gotchi-sleeves-right gotchi-sleeves-down">' +
    readSvg(`${name}Right`) +
    "</g>";
  svg =
    "<g>" +
    leftSleevesUp +
    leftSleeves +
    rightSleevesUp +
    rightSleeves +
    "</g>";
  sleeves.push({ id: id, svg: svg });
}
