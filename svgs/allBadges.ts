import assert from "assert";
import {
  aastronautMemberBadgeId,
  aastronautMemberBadgeSvg,
  coindeskConsensus,
  coindeskConsensusSvg,
  pumpkinBadgeIds,
  pumpkinBadgeSvgs,
  szn1BadgeIds,
  szn1BadgeSvgs,
  szn2BadgeIds,
  szn2BadgeSvgs,
  szn3BadgeIds,
  szn3BadgeSvgs,
  szn4BadgeIds,
  szn4BadgeSvgs,
  szn5BadgeIds,
  szn5BadgeSvgs,
  tooorkeyBadgeIds,
  tooorkeyBadgeSvgs,
  uniclyBaadgeId,
  uniclyBaadgeSvg,
} from "./BadgeData";

const fs = require("fs");
const BaadgeSvgMap = new Map<number, string>();

//create a number to svg map

export function getBaadge(id: number) {
  readBadgesBatch("svgItems", szn1BadgeSvgs, szn1BadgeIds);
  readBadgesBatch("svgItems", coindeskConsensusSvg, coindeskConsensus);
  readBadgesBatch("svgItems", uniclyBaadgeSvg, uniclyBaadgeId);
  readBadgesBatch(
    "svgItems",
    aastronautMemberBadgeSvg,
    aastronautMemberBadgeId
  );
  readBadgesBatch("baadges", szn2BadgeSvgs, szn2BadgeIds);
  readBadgesBatch("sZN3Baadges", szn3BadgeSvgs, szn3BadgeIds);
  readBadgesBatch("sZN4Baadges", szn4BadgeSvgs, szn4BadgeIds);
  readBadgesBatch("sZN5Baadges", szn5BadgeSvgs, szn5BadgeIds);
  readBadgesBatch("pumpkinBadge", tooorkeyBadgeSvgs, tooorkeyBadgeIds);
  readBadgesBatch("pumpkinBadge", pumpkinBadgeSvgs, pumpkinBadgeIds);

  const svg = BaadgeSvgMap.get(id);
  if (svg === undefined) {
    console.error("svg not found for id: ", id);
  }
  return svg!;
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
  let svg;
  try {
    svg = fs.readFileSync(`./svgs/${folder}/${name}.svg`, "utf8");
  } catch (error) {
    console.error(error);
  }
  return stripSvg(svg);
}

function readBadgesBatch(folder: string, names: string[], svgIds: number[]) {
  assert(
    names.length === svgIds.length,
    "names and svgIds must be the same length"
  );
  for (let i = 0; i < names.length; i++) {
    BaadgeSvgMap.set(svgIds[i], readSvg(names[i], folder));
  }
}
