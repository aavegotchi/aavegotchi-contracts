import { Exceptions, SideDimensions } from "../../scripts/itemTypeHelpers";
import { ethers } from "hardhat";

export const sideViewDimensions: SideDimensions[] = [
  {
    itemId: 370,
    name: "Wavy Hair",
    side: "back",
    dimensions: { x: 12, y: 3, width: 39, height: 31 },
  },
  {
    itemId: 370,
    name: "Wavy Hair",
    side: "left",
    dimensions: { x: 15, y: 3, width: 34, height: 31 },
  },
  {
    itemId: 370,
    name: "Wavy Hair",
    side: "right",
    dimensions: { x: 15, y: 3, width: 34, height: 31 },
  },
  {
    itemId: 371,
    name: "Plastic Earrings",
    side: "left",
    dimensions: { x: 31, y: 25, width: 3, height: 7 },
  },
  {
    itemId: 371,
    name: "Plastic Earrings",
    side: "right",
    dimensions: { x: 30, y: 25, width: 3, height: 7 },
  },
  {
    itemId: 371,
    name: "Plastic Earrings",
    side: "back",
    dimensions: { x: 9, y: 25, width: 46, height: 7 },
  },
  {
    itemId: 372,
    name: "Party Dress",
    side: "left",
    dimensions: { x: 18, y: 31, width: 30, height: 19 },
  },
  {
    itemId: 372,
    name: "Party Dress",
    side: "right",
    dimensions: { x: 16, y: 31, width: 32, height: 19 },
  },
  {
    itemId: 372,
    name: "Party Dress",
    side: "back left up",
    dimensions: { x: 10, y: 33, width: 5, height: 5 },
  },
  {
    itemId: 372,
    name: "Party Dress",
    side: "back left",
    dimensions: { x: 10, y: 36, width: 5, height: 5 },
  },
  {
    itemId: 372,
    name: "Party Dress",
    side: "back right up",
    dimensions: { x: 49, y: 33, width: 5, height: 5 },
  },
  {
    itemId: 372,
    name: "Party Dress",
    side: "back right",
    dimensions: { x: 49, y: 36, width: 5, height: 5 },
  },
  {
    itemId: 372,
    name: "Party Dress",
    side: "back",
    dimensions: { x: 10, y: 33, width: 42, height: 17 },
  },
  {
    itemId: 372,
    name: "Party Dress",
    side: "left up",
    dimensions: { x: 28, y: 31, width: 5, height: 5 },
  },
  {
    itemId: 372,
    name: "Party Dress",
    side: "left down",
    dimensions: { x: 27, y: 38, width: 5, height: 5 },
  },
  {
    itemId: 372,
    name: "Party Dress",
    side: "right up",
    dimensions: { x: 32, y: 31, width: 5, height: 5 },
  },
  {
    itemId: 372,
    name: "Party Dress",
    side: "right down",
    dimensions: { x: 32, y: 38, width: 5, height: 5 },
  },

  {
    itemId: 373,
    name: "Overalls",
    side: "left",
    dimensions: { x: 20, y: 33, width: 24, height: 22 },
  },
  {
    itemId: 373,
    name: "Overalls",
    side: "right",
    dimensions: { x: 20, y: 33, width: 24, height: 22 },
  },
  {
    itemId: 373,
    name: "Overalls",
    side: "back left up",
    dimensions: { x: 12, y: 30, width: 4, height: 11 },
  },
  {
    itemId: 373,
    name: "Overalls",
    side: "back left",
    dimensions: { x: 12, y: 33, width: 4, height: 11 },
  },
  {
    itemId: 373,
    name: "Overalls",
    side: "back right up",
    dimensions: { x: 48, y: 30, width: 4, height: 11 },
  },
  {
    itemId: 373,
    name: "Overalls",
    side: "back right",
    dimensions: { x: 48, y: 33, width: 4, height: 11 },
  },
  {
    itemId: 373,
    name: "Overalls",
    side: "back",
    dimensions: { x: 12, y: 30, width: 34, height: 23 },
  },
  {
    itemId: 373,
    name: "Overalls",
    side: "left up",
    dimensions: { x: 24, y: 33, width: 11, height: 5 },
  },
  {
    itemId: 373,
    name: "Overalls",
    side: "left down",
    dimensions: { x: 29, y: 35, width: 5, height: 11 },
  },
  {
    itemId: 373,
    name: "Overalls",
    side: "right up",
    dimensions: { x: 29, y: 33, width: 11, height: 5 },
  },
  {
    itemId: 373,
    name: "Overalls",
    side: "right down",
    dimensions: { x: 30, y: 35, width: 5, height: 11 },
  },

  {
    itemId: 374,
    name: "Lens Frens Plant",
    side: "left",
    dimensions: { x: 7, y: 36, width: 19, height: 27 },
  },
  {
    itemId: 374,
    name: "Lens Frens Plant",
    side: "back",
    dimensions: { x: 0, y: 36, width: 25, height: 27 },
  },
  {
    itemId: 374,
    name: "Lens Frens Plant",
    side: "right",
    dimensions: { x: 38, y: 36, width: 19, height: 27 },
  },

  {
    itemId: 375,
    name: "GM Seeds",
    side: "left",
    dimensions: { x: 15, y: 35, width: 16, height: 17 },
  },
  {
    itemId: 375,
    name: "GM Seeds",
    side: "back",
    dimensions: { x: 0, y: 34, width: 16, height: 17 },
  },
  {
    itemId: 375,
    name: "GM Seeds",
    side: "right",
    dimensions: { x: 33, y: 35, width: 16, height: 17 },
  },

  {
    itemId: 376,
    name: "Lick Brain",
    side: "back",
    dimensions: { x: 15, y: 1, width: 34, height: 22 },
  },
  {
    itemId: 376,
    name: "Lick Brain",
    side: "left",
    dimensions: { x: 20, y: 1, width: 24, height: 22 },
  },
  {
    itemId: 376,
    name: "Lick Brain",
    side: "right",
    dimensions: { x: 20, y: 1, width: 24, height: 22 },
  },

  {
    itemId: 377,
    name: "Lick Eyes",
    side: "back",
    dimensions: { x: 15, y: 22, width: 34, height: 8 },
  },
  {
    itemId: 377,
    name: "Lick Eyes",
    side: "left",
    dimensions: { x: 20, y: 22, width: 24, height: 8 },
  },
  {
    itemId: 377,
    name: "Lick Eyes",
    side: "right",
    dimensions: { x: 20, y: 22, width: 24, height: 8 },
  },

  {
    itemId: 378,
    name: "Lick Tongue",
    side: "left",
    dimensions: { x: 19, y: 31, width: 5, height: 8 },
  },
  {
    itemId: 378,
    name: "Lick Tongue",
    side: "right",
    dimensions: { x: 40, y: 31, width: 5, height: 8 },
  },

  {
    itemId: 379,
    name: "Lick Tentacle",
    side: "back",
    dimensions: { x: 4, y: 27, width: 8, height: 28 },
  },
  {
    itemId: 379,
    name: "Lick Tentacle",
    side: "left",
    dimensions: { x: 24, y: 27, width: 8, height: 28 },
  },
  {
    itemId: 379,
    name: "Lick Tentacle",
    side: "right",
    dimensions: { x: 32, y: 27, width: 8, height: 28 },
  },

  {
    itemId: 380,
    name: "Sebastien Hair",
    side: "back",
    dimensions: { x: 15, y: 4, width: 34, height: 26 },
  },
  {
    itemId: 380,
    name: "Sebastien Hair",
    side: "left",
    dimensions: { x: 23, y: 4, width: 21, height: 26 },
  },
  {
    itemId: 380,
    name: "Sebastien Hair",
    side: "right",
    dimensions: { x: 20, y: 4, width: 21, height: 26 },
  },

  {
    itemId: 381,
    name: "Voxel Eyes",
    side: "left",
    dimensions: { x: 19, y: 21, width: 6, height: 10 },
  },
  {
    itemId: 381,
    name: "Voxel Eyes",
    side: "right",
    dimensions: { x: 39, y: 21, width: 6, height: 10 },
  },

  {
    itemId: 382,
    name: "GOATee",
    side: "left",
    dimensions: { x: 19, y: 32, width: 3, height: 10 },
  },
  {
    itemId: 382,
    name: "GOATee",
    side: "right",
    dimensions: { x: 42, y: 32, width: 3, height: 10 },
  },

  {
    itemId: 383,
    name: "Sandbox Hoodie",
    side: "left",
    dimensions: { x: 20, y: 33, width: 26, height: 20 },
  },
  {
    itemId: 383,
    name: "Sandbox Hoodie",
    side: "right",
    dimensions: { x: 18, y: 33, width: 26, height: 20 },
  },
  {
    itemId: 383,
    name: "Sandbox Hoodie",
    side: "back left up",
    dimensions: { x: 12, y: 32, width: 4, height: 9 },
  },
  {
    itemId: 383,
    name: "Sandbox Hoodie",
    side: "back left",
    dimensions: { x: 12, y: 33, width: 4, height: 9 },
  },
  {
    itemId: 383,
    name: "Sandbox Hoodie",
    side: "back right up",
    dimensions: { x: 48, y: 32, width: 4, height: 9 },
  },
  {
    itemId: 383,
    name: "Sandbox Hoodie",
    side: "back right",
    dimensions: { x: 48, y: 33, width: 4, height: 9 },
  },
  {
    itemId: 383,
    name: "Sandbox Hoodie",
    side: "back",
    dimensions: { x: 12, y: 32, width: 34, height: 20 },
  },
  {
    itemId: 383,
    name: "Sandbox Hoodie",
    side: "left up",
    dimensions: { x: 26, y: 33, width: 9, height: 5 },
  },
  {
    itemId: 383,
    name: "Sandbox Hoodie",
    side: "left down",
    dimensions: { x: 29, y: 35, width: 5, height: 9 },
  },
  {
    itemId: 383,
    name: "Sandbox Hoodie",
    side: "right up",
    dimensions: { x: 29, y: 33, width: 9, height: 5 },
  },
  {
    itemId: 383,
    name: "Sandbox Hoodie",
    side: "right down",
    dimensions: { x: 30, y: 35, width: 5, height: 9 },
  },

  {
    itemId: 384,
    name: "Faangs",
    side: "left",
    dimensions: { x: 20, y: 31, width: 5, height: 7 },
  },
  {
    itemId: 384,
    name: "Faangs",
    side: "right",
    dimensions: { x: 39, y: 31, width: 5, height: 7 },
  },

  {
    itemId: 385,
    name: "Block Scanners",
    side: "left",
    dimensions: { x: 19, y: 19, width: 8, height: 12 },
  },
  {
    itemId: 385,
    name: "Block Scanners",
    side: "right",
    dimensions: { x: 37, y: 19, width: 8, height: 12 },
  },

  {
    itemId: 386,
    name: "Staff Charming",
    side: "back",
    dimensions: { x: 4, y: 5, width: 13, height: 56 },
  },
  {
    itemId: 386,
    name: "Staff Charming",
    side: "left",
    dimensions: { x: 23, y: 5, width: 8, height: 56 },
  },
  {
    itemId: 386,
    name: "Staff Charming",
    side: "right",
    dimensions: { x: 33, y: 5, width: 8, height: 56 },
  },

  {
    itemId: 387,
    name: "Roflnoggin",
    side: "back",
    dimensions: { x: 13, y: 2, width: 38, height: 22 },
  },
  {
    itemId: 387,
    name: "Roflnoggin",
    side: "left",
    dimensions: { x: 18, y: 2, width: 28, height: 22 },
  },
  {
    itemId: 387,
    name: "Roflnoggin",
    side: "right",
    dimensions: { x: 18, y: 2, width: 28, height: 22 },
  },
];

export const forgeSideExceptions: Exceptions[] = [
  {
    itemId: 374,
    slotPosition: 6,
    side: "wearables-back",
    exceptionBool: true,
  },
  {
    itemId: 371,
    slotPosition: 1,
    side: "wearables-left",
    exceptionBool: true,
  },
  {
    itemId: 371,
    slotPosition: 1,
    side: "wearables-right",
    exceptionBool: true,
  },

  {
    itemId: 306,
    slotPosition: 1,
    side: "wearables-right",
    exceptionBool: true,
  },
  {
    itemId: 306,
    slotPosition: 1,
    side: "wearables-left",
    exceptionBool: true,
  },
  {
    itemId: 381,
    slotPosition: 2,
    side: "wearables-right",
    exceptionBool: true,
  },
  {
    itemId: 381,
    slotPosition: 2,
    side: "wearables-left",
    exceptionBool: true,
  },
  {
    itemId: 381,
    slotPosition: 2,
    side: "wearables-front",
    exceptionBool: true,
  },
];
