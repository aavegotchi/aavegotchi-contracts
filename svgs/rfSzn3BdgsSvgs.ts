/* eslint-disable  prefer-const */

const fs = require("fs");

export const baadges = [
  badge("Aavegotchi-RF-SZN3-Trophy-RARITY-CHAMP"),
  badge("Aavegotchi-RF-SZN3-Trophy-KINSHIP-CHAMP"),
  badge("Aavegotchi-RF-SZN3-Trophy-XP-CHAMP"),
  badge("Aavegotchi-RF-SZN3-Trophy-RARITY-2ND"),
  badge("Aavegotchi-RF-SZN3-Trophy-KINSHIP-2ND"),
  badge("Aavegotchi-RF-SZN3-Trophy-XP-2ND"),
  badge("Aavegotchi-RF-SZN3-Trophy-RARITY-3RD"),
  badge("Aavegotchi-RF-SZN3-Trophy-KINSHIP-3RD"),
  badge("Aavegotchi-RF-SZN3-Trophy-XP-3RD"),

  badge("Aavegotchi-RF-SZN3-Baadges-PLAAYER-RAANKED"),
  badge("Aavegotchi-RF-SZN3-Baadges-RARITY-T10"),
  badge("Aavegotchi-RF-SZN3-Baadges-KINSHIP-T10"),
  badge("Aavegotchi-RF-SZN3-Baadges-XP-T10"),
  badge("Aavegotchi-RF-SZN3-Baadges-RARITY-T100"),
  badge("Aavegotchi-RF-SZN3-Baadges-KINSHIP-T100"),
  badge("Aavegotchi-RF-SZN3-Baadges-XP-T100"),
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
  return stripSvg(fs.readFileSync(`./svgs/sZN3Baadges/${name}.svg`, "utf8"));
}

function badge(name: string) {
  const svg = readSvg(name);
  return svg;
}
