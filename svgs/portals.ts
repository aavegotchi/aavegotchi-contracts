/* eslint-disable  prefer-const */

const fs = require("fs");

export const closedPortals: string[] = [];

export const openedPortals: string[] = [];

portal("h1-closed", true);
portal("h2-closed", true);

portal("h1-open", false);
portal("h2-open", false);

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

function portal(name: string, closed: boolean) {
  const svg: string = readSvg(name);
  if (closed) {
    closedPortals.push(svg);
  } else {
    openedPortals.push(svg);
  }
}
