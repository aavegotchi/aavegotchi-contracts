/* eslint-disable  prefer-const */

const fs = require("fs");

const portals = [];

portal("h1-closed");
portal("h1-closed");
portal("h2-closed");

function stripSvg(svg) {
  // removes svg tag
  if (svg.includes("viewBox")) {
    svg = svg.slice(svg.indexOf(">") + 1);
    svg = svg.replace("</svg>", "");
  }
  return svg;
}

function readSvg(name) {
  return stripSvg(fs.readFileSync(`./svgs/${name}.svg`, "utf8"));
}

function portal(name) {
  const svg = readSvg(name);
  portals.push(svg);
}

exports.closedPortalSvgs = portals;
