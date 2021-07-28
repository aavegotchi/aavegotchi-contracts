/* eslint-disable  prefer-const */

const fs = require("fs");

const wearables = [];
const sleeves = [];

wearable("206_BikerHelmet"), wearable("207_BikerJacket"); //no sleeves
wearable("208_Aviators"), wearable("209_HorseshoeMustache");

function stripSvg(svg) {
  // removes svg tag
  if (svg.includes("viewBox")) {
    svg = svg.slice(svg.indexOf(">") + 1);
    svg = svg.replace("</svg>", "");
  }
  return svg;
}

function readSvg(name) {
  return stripSvg(fs.readFileSync(`./svgs/svgItems/${name}.svg`, "utf8"));
}

function wearable(name) {
  const svg = readSvg(name);
  wearables.push(svg);
}

function bodyWearable(name) {
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

exports.wearablesSvgs = wearables;
exports.sleevesSvgs = sleeves;
