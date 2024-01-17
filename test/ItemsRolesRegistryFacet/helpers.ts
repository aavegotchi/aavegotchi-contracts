import { solidityKeccak256 } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { GrantRoleData, Commitment } from "./types";

const { HashZero, AddressZero } = ethers.constants;
export const ONE_DAY = 60 * 60 * 24;


export function generateRandomInt() {
  return Math.floor(Math.random() * 1000 * 1000) + 1;
}
// 201 - hand - slot 4,5
// 224 - eye - slot 2
// 218 - head - slot 3
// 211 - head - slot 3
// 200 - body - slot 0
// 152 - pet - slot 6
export const wearableIds = [201, 224, 218, 211, 200, 152];
export const aavegotchiDiamondAddress =
  "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
export const wearableDiamondAddress =
  "0x58de9AaBCaeEC0f69883C94318810ad79Cc6a44f";
export const diamondUpgrader = "0x35fe3df776474a7b24b3b1ec6e745a830fdad351";
export const EQUIPPED_WEARABLE_SLOTS = 16;
export const wearableSlots = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

export function buildCommitment({
  grantor = AddressZero,
  tokenAddress = wearableDiamondAddress,
  tokenId = wearableIds[0],
  tokenAmount = 1,
}): Commitment {
  return { grantor, tokenAddress, tokenId, tokenAmount }
}

export async function buildGrantRole({
  commitmentId = generateRandomInt(),
  role = 'Player()',
  grantee = AddressZero,
  expirationDate = null,
  revocable = true,
  data = HashZero,
}): Promise<GrantRoleData> {
  return {
    commitmentId,
    role: generateRoleId(role),
    grantee,
    expirationDate: expirationDate ? expirationDate : (await time.latest()) + ONE_DAY,
    revocable,
    data,
  }
}

export function generateRoleId(role: string) {
  return solidityKeccak256(["string"], [role]);
}

export class time {
  static increase = async (seconds: number) => {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine", []);
  };

  static latest = async () => {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp;
  };
}

export const LargeGotchiOwner = "0x7D20E3aE9A4198c2CfC0E2d1D0Bb81cBc41ab0A0";

export const LargeGotchiOwnerAavegotchis = [
  8503, 6142, 8785, 600, 6374, 18449, 13789, 6882, 3819, 7480, 24492, 22271,
  5372, 2962, 9133, 9681, 6880, 9501, 4481, 1083, 11569, 5908, 6854, 9877, 6375,
  15652, 10618, 3820, 6918, 8207, 1207, 6881, 5247, 13226, 7585, 20228, 1432,
  9137, 6967, 5036, 2134, 5470, 6438, 6681, 1557, 15513, 12493, 16507, 18041,
  17669, 8583, 12467, 8205, 2903, 5540, 17728, 3387, 529, 7495, 15334, 164,
  1147, 6639, 7548, 3938, 14413, 3939, 7547, 6919, 3265, 6189, 5666, 8082, 37,
  6052, 2990, 1874, 1071, 3280, 9853, 4756, 6684, 663, 6920, 1321, 16829, 3662,
  17479, 10956, 6584, 6533, 3853, 9147, 1558, 3124, 2391, 7953, 8383, 2907,
  7110, 18175, 4591, 6916, 3371, 19992, 1426, 15243, 13998, 18470, 15583, 20157,
  18620, 17704, 12962, 13318, 21779, 23525, 15575, 16278, 15801, 14288, 13615,
  20045, 11371, 20487, 11525, 17144, 14128, 24443, 19280, 15923, 22346, 22234,
  21145, 11706, 17755, 20626, 17881, 15653, 11049, 24768, 11068, 12685, 15143,
  22241, 18305, 22780, 21140, 18387, 21546, 15616, 11886, 6149, 10626, 16793,
  17105, 17703, 20096, 18332,
];
