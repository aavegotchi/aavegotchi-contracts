const fs = require("fs");

// Make sure that the entire enclosing <g> has a class="collateral"

function stripSvg(svg) {
  // removes svg tag
  if (svg.includes("viewBox")) {
    svg = svg.slice(svg.indexOf(">") + 1);
    svg = svg.replace("</svg>", "");
  }
  return svg;
}

function readSvg(name) {
  return stripSvg(
    fs.readFileSync(`./svgs/collateral-sides/${name}.svg`, "utf8")
  );
}

function collateral(name) {
  let svg = readSvg(name);
  svg = `<g class="gotchi-collateral">${svg}</g>`;
  return svg;
}

const collateralsLeftSvgs = [
  collateral("Left-Collateral-DAI"),
  collateral("Left-Collateral-ETH"),
  collateral("Left-Collateral-AAVE"),
  collateral("Left-Collateral-LINK"),
  collateral("Left-Collateral-USDT"),
  collateral("Left-Collateral-USDC"),
  collateral("Left-Collateral-UNI"),
  collateral("Left-Collateral-YFI"),
  collateral("Left-Collateral-TUSD"),
  //h2
  collateral("Left-Collateral-wETH"),
  collateral("Left-Collateral-wBTC"),
  collateral("Left-Collateral-Polygon"),
];

const collateralsRightSvgs = [
  collateral("Right-Collateral-DAI"),
  collateral("Right-Collateral-ETH"),
  collateral("Right-Collateral-AAVE"),
  collateral("Right-Collateral-LINK"),
  collateral("Right-Collateral-USDT"),
  collateral("Right-Collateral-USDC"),
  collateral("Right-Collateral-UNI"),
  collateral("Right-Collateral-YFI"),
  collateral("Right-Collateral-TUSD"),
  //h2
  collateral("Right-Collateral-wETH"),
  collateral("Right-Collateral-wBTC"),
  collateral("Right-Collateral-Polygon"),
];

exports.collateralsLeftSvgs = collateralsLeftSvgs;
exports.collateralsRightSvgs = collateralsRightSvgs;
