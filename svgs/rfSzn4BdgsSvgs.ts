/* eslint-disable  prefer-const */

const fs = require("fs");

export const baadges = [
  badge("Aavegotchi-RF-SZN4-Trophy-CHAMP-RARITY"),
  badge("Aavegotchi-RF-SZN4-Trophy-CHAMP-KINSHIP"),
  badge("Aavegotchi-RF-SZN4-Trophy-CHAMP-XP"),
  badge("Aavegotchi-RF-SZN4-Trophy-2ND-RARITY"),
  badge("Aavegotchi-RF-SZN4-Trophy-2ND-KINSHIP"),
  badge("Aavegotchi-RF-SZN4-Trophy-2ND-XP"),
  badge("Aavegotchi-RF-SZN4-Trophy-3RD-RARITY"),
  badge("Aavegotchi-RF-SZN4-Trophy-3RD-KINSHIP"),
  badge("Aavegotchi-RF-SZN4-Trophy-3RD-XP"),

  badge("Aavegotchi-RF-SZN4-Baadge-RAANKED"),
  badge("Aavegotchi-RF-SZN4-Baadge-TOP10-RARITY"),
  badge("Aavegotchi-RF-SZN4-Baadge-TOP10-KINSHIP"),
  badge("Aavegotchi-RF-SZN4-Baadge-TOP10-XP"),
  badge("Aavegotchi-RF-SZN4-Baadge-T100-RARITY"),
  badge("Aavegotchi-RF-SZN4-Baadge-T100-KINSHIP"),
  badge("Aavegotchi-RF-SZN4-Baadge-T100-XP"),
];

function stripSvg(svg: string) {
  // removes svg tag
  if (svg.includes("viewBox")) {
    svg = svg.slice(svg.indexOf(">") + 1);
    svg = svg.replace("</svg>", "");
  }
  return svg;
}

function readSvg(name: string) {
  return stripSvg(fs.readFileSync(`./svgs/sZN4Baadges/${name}.svg`, "utf8"));
}

function badge(name: string) {
  const svg = readSvg(name);
  return svg;
}
