/* eslint-disable  prefer-const */

const fs = require("fs");

export const closedPortals: string[] = [];

portal("h1-closed");
portal("h1-closed");
portal("h2-closed");

function stripSvg(svg: string) {
  // removes svg tag
  if (svg.includes("viewBox")) {
    svg = svg.slice(svg.indexOf(">") + 1);
    svg = svg.replace("</svg>", "");
  }
  return svg;
}

function readSvg(name: string) {
  return stripSvg(fs.readFileSync(`./svgs/${name}.svg`, "utf8"));
}

function portal(name: string) {
  const svg: string = readSvg(name);
  closedPortals.push(svg);
}
